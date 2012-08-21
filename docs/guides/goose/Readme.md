# Goose: MongoDB ORM Organizational Pattern

NGN already provides direct access to MongoDB using NGN.datasource.MongoDB,
but many applications use a specific data structure that requires validation,
referential integrity, pre/post-conditions, and other standard data processing.
In these situations, an ORM is typically used to reduce mundane and repetitive
tasks on data objects.

Goose wraps [Mongoose](http://mongoosejs.com), a popular ORM module,
and extends it to support code organization, schema isolation, etc. 

For example, each schema is stored in a single `.js` file within a schema directory,
complete with some dependency management. Goose creates an easy to use 
collection of schemas and makes them available throughout an application.

Organizing files this way may be more familiar for those used to working
with RDBMS platforms like MySQL, SQL Server, Oracle, etc. Identifying a 
schema is a matter of looking at the directory. Since each file is named
according to the schema name, it is similar to looking through a tree of 
database tables.

Additionally, Goose schemas can be better documented and included in custom
API's created with NGN.

## Basic Example

Suppose schemas called `BlogPost.js` and `Comment.js` exist in `/path/to/schemas`.

**/path/to/schemas/BlogPost.js**
	var Schema 		= require('mongoose').Schema,
		Comment		= require('./Comment');
	
	module.exports = new Schema({
	
		id		  : ObjectId,
		author    : Number,
		title     : String,
		body      : String,
		buf       : Buffer,
		date      : Date,
		comments  : [Comment],
		meta      : {
						votes : Number,
						favs  : Number
				  }
	});

**/path/to/schemas/Comment.js**
	var Schema 			= require('mongoose').Schema,
		number			= require('./plugins/comment');
	
	module.exports = new Schema({
		name:	{ type: String, 'default': 'hahaha' },
		age:	{ type: Number, min: 18, index: true },
		bio:	{ type: String, match: /[a-z]/ },
		msg:	String,
		date:	{ type: Date, 'default': Date.now },
		buff:	Buffer
	});
	
	//Utilize a plugin
	Comment.plugin(number);
	
	// Middleware
	Comment.pre('save', function (next) {
	  notify(this.get('email'));
	  next();
	});

**app.js**
	require('ngn');
	
	NGN.application(function(){
	
		// Create the MongoDB Connection
		var database = new NGN.datasource.MongoDB({
			id: 'mongo_orm',
			host: 		'mongo.domain.com',
			port: 		30007,
			database: 	'my_db',
			username: 	'user',
			password: 	'password'
		});
	
		// Add Goose ORM
		var ORM = new NGNX.datasource.orm.Goose({
			schemas: 	'/path/to/schemas',
			connection:	'mongo_orm'		// Could also be connection: database
		});
		
		// Create a blog post
		var blog = new ORM.schema.BlogPost();
		blog.author = 'John Doe';
		blog.title  = 'Some Headline';
		blog.body	= 'Anonymous man publishes this mysterious writing to the web.';
		
		// Add a comment to the post
		var comment = new ORM.schema.Comment();
		comment.msg = 'Anonymous comments add to the mystery.';
		
		blog.comments.push(comment);
		
		// Save to Mongo.
		blog.save(function(){
			console.log('Post saved');
			
			// Query Mongo for all blog posts.
			ORM.schema.BlogPost.find({},function( err, docs ) {
				if ( err ) throw err;
				console.log(docs);
			});
		});
	
	});

The code above isn't terribly practical, but it does illustrate several features.
Notice the Goose ORM object is capable of identifying a data source by name when
used within an NGN application. Therefore, the ORM is accessible throughout the
entire application.

## Accessing ORM Anywhere

NGNA is a "sugar" shortcut to `NGN.app`. The {@link NGN.app.Application#getORM getORM()} method of NGN.app provides direct access
to the ORM object.

Continuing with the example above, ORM can be used anywhere. If the application provides a REST 
API using NGN.web.API, it may make sense to create, read, update, or delete (CRUD) objects in 
the database using the API as an interface.

**example routes/root.js**
	'/blog/port/:id': {
		get: function(req,res){
			var orm 	= NGNA.getORM('mongo_orm').schemas;
			
			// Find a specific post.
			orm.BlogPost.findOne({id:req.qs.id},function(err,doc){
				if (doc)
					res.json(doc);
				else
					res.send(404); // Not found
			}).
		}
	}
The example above would receive the REST request, run a query against all `BlogPost`
collections in the MongoDB store, and return the results. If the corresponding blog post is found,
the REST API responded with `doc` (JSON). If it is not found, a `404` response
is sent back.

Similarly, creating a blog post via REST would be implemented with code like:

	'/blog/post': {
		post: function(req,res){
			var orm = NGNA.getORM('mongo_orm').schemas;
			
			// Create new BlogPost ORM object.
			var blog = new orm.BlogPost();
			
			// Populate with data
			blog.author = 'John Doe';
			blog.title  = req.form.title;
			blog.body	= req.form.body;

			// Save to MongoDB
			blog.save(function(err){
				if (err)
					res.send(500,err);
				else
					res.send(201); // Tell the requestor the blog post was created.
			});
		}
	}
The example above would respond to a `POST` request submitted to `http://domain.com/blog/post` with a JSON body similar to:
	{
		"title": "I love node.js!",
		"body":	 "It's pretty easy to use!"
	}
_The example assumes_ NGNX.web.ApiRequestHelper _is supplied to_ NGN.web.API _on creation._

The JSON body is received by the API. A new `BlogPost`  is created, populated using the attributes
from the JSON body, then saved. Upon completion, a response is sent with either an error or a `201 (Created)`.

## Schemas

Schemas are an important concept in MongoDB ORM. Each schema is similar to a schema/table in a more
traditional RDBMS environment.

TODO: Complete This 

## TODO: Global Plugins

[Mongoose](http://mongoosejs.com/docs/plugins.html) supports plugins


## TODO: Middleware