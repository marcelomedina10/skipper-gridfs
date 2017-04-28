# [<img title="skipper-gridfs - GridFS filesystem adapter for Skipper" src="http://i.imgur.com/P6gptnI.png" width="200px" alt="skipper emblem - face of a ship's captain"/>](https://github.com/willhuang85/skipper-gridfs) GridFS Filesystem Adapter

[![NPM version](https://badge.fury.io/js/skipper-gridfs.png)](http://badge.fury.io/js/skipper-gridfs) &nbsp; &nbsp;
[![Build Status](https://travis-ci.org/willhuang85/skipper-gridfs.svg?branch=master)](https://travis-ci.org/willhuang85/skipper-gridfs)

GridFS adapter for receiving [upstreams](https://github.com/balderdashy/skipper#what-are-upstreams). Particularly useful for handling streaming multipart file uploads from the [Skipper](https://github.com/balderdashy/skipper) body parser.


========================================

## Installation

```
$ npm install skipper-gridfs --save
```

Also make sure you have skipper [installed as your body parser](http://beta.sailsjs.org/#/documentation/concepts/Middleware?q=adding-or-overriding-http-middleware).

> Skipper is installed by default in [Sails](https://github.com/balderdashy/sails) v0.10.

========================================


## Usage

```javascript````
req.file('avatar')
.upload({
  adapter: require('skipper-gridfs'),
  uri: 'mongodb://jimmy@j1mtr0n1xx@mongo.jimmy.com:27017/coolapp.avatar_uploads'
}, function whenDone(err, uploadedFiles) {
  if (err) return res.negotiate(err);
  else return res.ok({
    files: uploadedFiles,
    textParams: req.params.all()
  });
});
```

For more detailed usage information and a full list of available options, see the Skipper docs, especially the section on "[Uploading to GridFS](https://github.com/balderdashy/skipper#uploading-files-to-gridfs)".


One important adapter-specific option to note is `uri`:

| Option        | Type       | Details |
|-----------    |:----------:|---------|
| `uri`         | ((string)) | An optional parameter if you wish the enter your mongodb credentials as a URI, e.g. `mongodb://username:password@localhost:27107/databasename.bucket?options`.<br/> (Check [mongo client URI syntax](https://docs.mongodb.com/manual/reference/connection-string/)).|
| `maxBytes`    | ((integer))| Optional. Max total number of bytes permitted for a given upload, calculated by summing the size of all files in the upstream; e.g. if you created an upstream that watches the "avatar" field (req.file('avatar')), and a given request sends 15 file fields with the name "avatar", maxBytes will check the total number of bytes in all of the 15 files. If maxBytes is exceeded, the already-written files will be left untouched, but unfinshed file uploads will be garbage-collected, and not-yet-started uploads will be cancelled. (Note that maxBytes is currently experimental)|

========================================

## Contributions

are welcomed :ok_hand:

See [ROADMAP.md](https://github.com/willhuang85/skipper-gridfs/blob/master/ROADMAP.md).

Also be sure to check out [ROADMAP.md in the Skipper repo](https://github.com/balderdashy/skipper/blob/master/ROADMAP.md).

To run the tests:

```shell
$ URI=mongodb://username:password@localhost:27107/databasename.bucket npm test
```


========================================

## License

MIT
