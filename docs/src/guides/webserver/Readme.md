# Web Server Fundamentals

Needs to be filled in. Talk about templates, **routes**, etc.


## Caching Dynamic Templates

The NGN web server uses (consolidate)[https://github.com/visionmedia/consolidate.js] to support
multiple different template rendering engines. Each of the consolidate engines supports
caching at the route level. By default, caching is not enabled.

To enable caching for a specific URI route, the `cache:true` parameter should be passed as an option
when the template is rendered. For example:

	server.get('/my/path',function(req,res){
		res.render('index',{pagetitle:'Welcome',cache:true},function(err,html){
			if (err) throw err;
			console.log('Generated HTML:',html);
		});
	}); 

When the first request to http://mydomain.com/my/path is received, the template will
be rendered and stored in memory (RAM). All subsequent requests to this URL will 
render the cached content.
