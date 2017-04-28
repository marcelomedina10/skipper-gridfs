/**
 * Module dependencies
 */

const path = require('path');
const Writable = require('stream').Writable;
const muri = require('muri');
const _ = require('lodash');
const concat = require('concat-stream');
const fs = require('fs');
const MongoClient = require('mongodb').MongoClient,
    GridFSBucket = require('mongodb').GridFSBucket;

/**
 * skipper-gridfs
 *
 * @param  {Object} globalOpts
 * @return {Object}
 */

module.exports = function GridFSStore (globalOpts) {
    globalOpts = buildURI(globalOpts);

    _.defaults(globalOpts, {
        bucket: 'fs',
        url: 'mongodb://localhost:27017/your-mongodb-name'
    });


    return {
        ls: function (dirname, cb) {
            MongoClient.connect(globalOpts.url, globalOpts.options).then(db => {
                let gfsBucket = new GridFSBucket(db, {bucketName: globalOpts.bucket});
                gfsBucket.find({'metadata.dirname': dirname}).toArray().then(docs => {
                    db.close(true);
                    cb(null, _.map(docs, 'filename'));
                }).catch(err => {
                   db.close(true);
                   cb(err);
                });
            }).catch(err => cb(err));
        },

        read: function (fd, cb) {
            MongoClient.connect(globalOpts.url, globalOpts.options).then(db => {
                let gfsBucket = new GridFSBucket(db, {bucketName: globalOpts.bucket});
                let readStream = gfsBucket.openDownloadStreamByName(fd);
                readStream.once('error', function(err) {
                   db.close(true);
                   cb(err);
                });
                readStream.pipe(concat(function(data){
                    db.close(true);
                    cb(null,data);
                }))
            }).catch(err => cb(err));
        },

        rm: function (fd, cb) {
            console.log('calling rm');
            MongoClient.connect(globalOpts.url, globalOpts.options).then(db => {
                db.collection(globalOpts.bucket).findOneAndDelete({filename: fd}).then(() => {
                    db.close();
                    cb();
                }).catch(err => cb(err));
            }).catch(err => {
               cb(err);
            });
        },

        /**
         * A simple receiver for Skipper that writes Upstreams to
         * gridfs
         *
         *
         * @param  {Object} options
         * @return {Stream.Writable}
         */
        receive: function GridFSReceiver (options = {}) {
            options = _.defaults(options, globalOpts);

            let totalDataLength = 0;
            let receiver__ = Writable({
                objectMode: true
            });

            // This `_write` method is invoked each time a new file is received
            // from the Readable stream (Upstream) which is pumping filestreams
            // into this receiver.  (filename === `__newFile.filename`).
            receiver__._write = function onFile(__newFile, encoding, done) {
                let dataLength = 0;

                let fd = __newFile.fd;
                MongoClient.connect(options.url, options.options).then(db => {
                    let gfsBucket = new GridFSBucket(db, {bucketName: options.bucket});
                    let outs = gfsBucket.openUploadStream(fd, {
                        metadata: {
                            filename: __newFile.filename,
                            root: options.bucket,
                            fd: fd,
                            dirname: __newFile.dirname || path.dirname(fd)
                        },
                        content_type: __newFile.headers['content-type']
                    });

                    __newFile.on('data', function(data) {
                       dataLength += data.length;
                       totalDataLength += data.length;
                       this.byteCount = dataLength;

                       if (options.maxBytes && totalDataLength > options.maxBytes) {
                           outs.abort(function(){
                               db.close(true);
                           });
                           done({code: 'E_EXCEEDS_UPLOAD_LIMIT'});
                       }
                    });

                    outs.once('error', function(err) {
                        db.close(true);
                        receiver__.emit('error', err);
                        done(err);
                    });

                    outs.once('finish', function() {
                        db.close(true);
                        __newFile.extra = _.assign({fileId: this.id}, this.options.metadata);
                        done();
                    });
                    __newFile.pipe(outs);
                }).catch(err => {
                    receiver__.emit('error', err);
                    done(err);
                });
            };
            return receiver__;
        }
    };

    function buildURI(options) {
        let o = muri (options.uri);
        o.bucket = _.last(_.split(o.db, '.'));
        o.dbname = _.first(_.split(o.db, '.'));
        o.url = _.first(_.split(options.uri, '.'));
        return o;
    }
};
