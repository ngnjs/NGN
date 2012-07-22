module.exports = {
	'/': {
		get: function(){
			res.json({message:'Hello. I am root.'});
		}
	}
}
