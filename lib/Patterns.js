var Base = require('./NGN.core');
/**
 * @class NGN.Patterns
 * **EXPERIMENTAL**
 * 
 * A convenience collection of commonly used RegExp patterns. These can be used as validators, input masks, or any other pattern matching.
 * 
 * For example:
 * 		var pattern = new NGN.Patterns();
 * 		
 * 		if(pattern.isEmail('jdoe@doe.com'))
 * 			console.log('VALID email syntax');
 *			else
 * 			console.log('INVALID email syntax');
 * NGN#pattern offers a shortcut to this class so it does not need to be constructed before each use.
 * 
 * **NOTICE**
 * 
 * The patterns themselves are private properties of the class (Show private properties to view). These properties can be configured
 * when constructing a new PatternMatcher.
 * 
 * For example, the username pattern requires the value be between 3-16 characters. If the app requires a minimum 6 characters, this 
 * can be accomplished by overriding the pattern.
 * 
 * 		var pattern = new NGN.Patterns({
 * 			username: /^[a-z0-9_-]{6,16}$/ // Originally /^[a-z0-9_-]{3,16}$/
 * 		});
 * 
 * @singleton
 * @extends NGN.core
 */
var Class = Base.extend({
	
	constructor: function(config){
		
		config = config || {};
		
		Class.super.constructor.call(this,config);
		
		var props = {
			
			/**
			 * @property {RexExp} [email=/(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/]
			 * Uses [RFC 2822](http://www.faqs.org/rfcs/rfc2822.html).
			 * @private
			 */
			email: {
				value:		config.email || /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/,
				enumerable:	true,
				writable:	false
			},
			/**
			 * @method isEmail
			 * Indicates the match is an email address.
			 * @param {String} text
			 * The string to match.
			 * @returns {Boolean}
			 */
			
			/**
			 * @property {RegExp} [username=/^[a-z0-9_-]{3,16}$/]
			 * No spaces, between 3-16 characters.
			 * @private
			 */
			username: {
				value:		config.username || /^[a-z0-9_-]{3,16}$/,
				enumerable:	true,
				writable:	false
			},
			/**
			 * @method isUsername
			 * Indicates the match is a username.
			 * @param {String} text
			 * The string to match.
			 * @returns {Boolean}
			 */
			
			/**
			 * @property {RegExp} [passwordSimple=/^[a-z0-9_-]{6,18}$/]
			 * Requires 6-18 characters.
			 * @private
			 */
			passwordSimple: {
				value:		config.passwordSimple || /^[a-z0-9_-]{6,18}$/,
				enumerable:	true,
				writable:	false
			},
			/**
			 * @method isPasswordSimple
			 * Indicates the match is a simple password.
			 * @param {String} text
			 * The string to match.
			 * @returns {Boolean}
			 */
			
			/**
			 * @property {RegExp} [passwordStrong=/(?-i)(?=^.{7,}$)((?!.*\s)(?=.*[A-Z])(?=.*[a-z]))((?=(.*\d){1,})|(?=(.*\W){1,}))^.*$/]
			 * Strong password with the following requirements.
			 * 
			 * * At least 8 characters long.
			 * * At least 1 upper case AND at least 1 lower case.
			 * * At least 1 digit.
			 * * At least 1 symbol: `!@#$%^&*-`
			 * * No spaces.
			 * 
			 * @private
			 */
			passwordStrong: {
				value:		config.passwordStrong || /^(?=(?:.*[a-z]){1})(?=(?:.*[A-Z]){2})(?=(?:.*\d){1})(?=(?:.*[!@#$%^&*-]){1}).{8,}$/,
				enumerable:	true,
				writable:	false
			},
			/**
			 * @method isPasswordStrong
			 * Indicates the match is a strong password.
			 * @param {String} text
			 * The string to match.
			 * @returns {Boolean}
			 */
			
			/**
			 * @property {RegExp} [hex=/^#?([a-f0-9]{6}|[a-f0-9]{3})$/]
			 * Match a hex value (like `#ffffff`)
			 * @private
			 */
			hex: {
				value:		config.hex || /^#?([a-f0-9]{6}|[a-f0-9]{3})$/,
				enumerable:	true,
				writable:	false
			},
			/**
			 * @method isHex
			 * Indicates the match is a hex value.
			 * @param {String} text
			 * The string to match.
			 * @returns {Boolean}
			 */
			
			/**
			 * @property {RegExp} [slug=/^[a-z0-9-]+$/]
			 * A common slug pattern.
			 * 
			 * **String that matches:**
			 * 
			 *		my-title-here
			 * 
			 * **String that doesnâ€™t match:**
			 * 
			 *		my_title_here (contains underscores)
			 * 
			 * [Source](http://net.tutsplus.com/tutorials/other/8-regular-expressions-you-should-know/)
			 * @private
			 */
			slug: {
				value:		config.slug || /^[a-z0-9-]+$/,
				enumerable:	true,
				writable:	false
			},
			/**
			 * @method isSlug
			 * Indicates the match is a slug.
			 * @param {String} text
			 * The string to match.
			 * @returns {Boolean}
			 */
			
			/**
			 * @property {RegExp} [domain=/^([a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,6}$/]
			 * Checks domain names. 
			 * This validates domains based on latest specifications (RFCs 952 and 1123 dealing with hostnames and RFC 1035 dealing with domain name system requirements) 
			 * except that it only includes realistic fully-qualified domains: 
			 * 
			 * * Requires at least one subdomain 
			 * * Allows shortest top-level domains like &quot;ca&quot;, and &quot;museum&quot; as longest. 
			 * 
			 * **Other validation rules**
			 * 
			 * * Labels/parts should be seperated by period.
			 * * Each label/part has maximum of 63 characters. 
			 * * First and last character of label must be alphanumeric, other characters alphanumeric or hyphen. 
			 * * Does not check maxlength of domain which incidentally is 253 characters of text (255 binary representation). 
			 * 
			 * For a regular expression that matches ALL domains, use #anyDomain.
			 * 
			 * [Source](http://www.regexlib.com)
			 * @private
			 */
			domain: {
				value:		config.domain || /^([a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,6}$/,
				enumerable:	true,
				writable:	false
			},
			
			/**
			 * @method isDomain
			 * Indicates the match is a domain.
			 * @param {String} text
			 * The string to match.
			 * @returns {Boolean}
			 */
			
			/**
			 * @property {RegExp} [anyDomain=/^([a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)*[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?$/]
			 * For a more particular matcher that uses RFC 952, 1123, & 1035, see #domain.
			 * [Source](http://www.regexlib.com)
			 * @private
			 */
			anyDomain: {
				value:		config.anyDomain || /^([a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)*[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?$/,
				enumerable:	true,
				writable:	false
			},
			
			/**
			 * @method isAnyDomain
			 * Indicates the match is any domain.
			 * @param {String} text
			 * The string to match.
			 * @returns {Boolean}
			 */
			
			/**
			 * @property {RegExp} [ip4=/^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/]
			 * Matches an IPv4 address like `127.0.0.1`.
			 * @private
			 */
			ip4: {
				value:		config.ip4 || /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/ ,
				enumerable:	true,
				writable:	false
			},
			
			/**
			 * @method isIp4
			 * Indicates the match is an IPv4 address.
			 * @param {String} text
			 * The string to match.
			 * @returns {Boolean}
			 */
			
			/**
			 * @property {RegExp} [ip6=/^(^(([0-9A-Fa-f]{1,4}(((:[0-9A-Fa-f]{1,4}){5}::[0-9A-Fa-f]{1,4})|((:[0-9A-Fa-f]{1,4}){4}::[0-9A-Fa-f]{1,4}(:[0-9A-Fa-f]{1,4}){0,1})|((:[0-9A-Fa-f]{1,4}){3}::[0-9A-Fa-f]{1,4}(:[0-9A-Fa-f]{1,4}){0,2})|((:[0-9A-Fa-f]{1,4}){2}::[0-9A-Fa-f]{1,4}(:[0-9A-Fa-f]{1,4}){0,3})|(:[0-9A-Fa-f]{1,4}::[0-9A-Fa-f]{1,4}(:[0-9A-Fa-f]{1,4}){0,4})|(::[0-9A-Fa-f]{1,4}(:[0-9A-Fa-f]{1,4}){0,5})|(:[0-9A-Fa-f]{1,4}){7}))$|^(::[0-9A-Fa-f]{1,4}(:[0-9A-Fa-f]{1,4}){0,6})$)|^::$)|^((([0-9A-Fa-f]{1,4}(((:[0-9A-Fa-f]{1,4}){3}::([0-9A-Fa-f]{1,4}){1})|((:[0-9A-Fa-f]{1,4}){2}::[0-9A-Fa-f]{1,4}(:[0-9A-Fa-f]{1,4}){0,1})|((:[0-9A-Fa-f]{1,4}){1}::[0-9A-Fa-f]{1,4}(:[0-9A-Fa-f]{1,4}){0,2})|(::[0-9A-Fa-f]{1,4}(:[0-9A-Fa-f]{1,4}){0,3})|((:[0-9A-Fa-f]{1,4}){0,5})))|([:]{2}[0-9A-Fa-f]{1,4}(:[0-9A-Fa-f]{1,4}){0,4})):|::)((25[0-5]|2[0-4][0-9]|[0-1]?[0-9]{0,2})\.){3}(25[0-5]|2[0-4][0-9]|[0-1]?[0-9]{0,2})$$/]
			 * Matches IPv6 addresses like `FEDC:BA98::3210:FEDC:BA98:7654:3210` or `::0:0:0:FFFF:129.144.52.38`.
			 * 
			 * **Non-Matches**
			 * 
			 * * `FEDC:BA98:7654:3210:FEDC:BA98:7654:3210:1234`
			 * * `3210:FEDC:BA98:7654:3210:1234`
			 * * `:FEDC:BA98:7654:3210:`
			 * @private
			 */
			ip6: {
				value:		config.ip6 || /^(^(([0-9A-Fa-f]{1,4}(((:[0-9A-Fa-f]{1,4}){5}::[0-9A-Fa-f]{1,4})|((:[0-9A-Fa-f]{1,4}){4}::[0-9A-Fa-f]{1,4}(:[0-9A-Fa-f]{1,4}){0,1})|((:[0-9A-Fa-f]{1,4}){3}::[0-9A-Fa-f]{1,4}(:[0-9A-Fa-f]{1,4}){0,2})|((:[0-9A-Fa-f]{1,4}){2}::[0-9A-Fa-f]{1,4}(:[0-9A-Fa-f]{1,4}){0,3})|(:[0-9A-Fa-f]{1,4}::[0-9A-Fa-f]{1,4}(:[0-9A-Fa-f]{1,4}){0,4})|(::[0-9A-Fa-f]{1,4}(:[0-9A-Fa-f]{1,4}){0,5})|(:[0-9A-Fa-f]{1,4}){7}))$|^(::[0-9A-Fa-f]{1,4}(:[0-9A-Fa-f]{1,4}){0,6})$)|^::$)|^((([0-9A-Fa-f]{1,4}(((:[0-9A-Fa-f]{1,4}){3}::([0-9A-Fa-f]{1,4}){1})|((:[0-9A-Fa-f]{1,4}){2}::[0-9A-Fa-f]{1,4}(:[0-9A-Fa-f]{1,4}){0,1})|((:[0-9A-Fa-f]{1,4}){1}::[0-9A-Fa-f]{1,4}(:[0-9A-Fa-f]{1,4}){0,2})|(::[0-9A-Fa-f]{1,4}(:[0-9A-Fa-f]{1,4}){0,3})|((:[0-9A-Fa-f]{1,4}){0,5})))|([:]{2}[0-9A-Fa-f]{1,4}(:[0-9A-Fa-f]{1,4}){0,4})):|::)((25[0-5]|2[0-4][0-9]|[0-1]?[0-9]{0,2})\.){3}(25[0-5]|2[0-4][0-9]|[0-1]?[0-9]{0,2})$$/,
				enumerable:	true,
				writable:	false
			},
			/**
			 * @method isIp6
			 * Indicates the match is an IPv6 address.
			 * @param {String} text
			 * The string to match.
			 * @returns {Boolean}
			 */
			
			/**
			 * @property {RegExp} [htmlTags=/^<([a-z]+)([^<]+)*(?:>(.*)<\/\1>|\s+\/>)$/]
			 * Supports matching non-descript HTML tags.
			 * 
			 * **Matches**
			 * 		<a href=â€�http://net.tutsplus.com/â€�>Nettuts+</a>
			 * 
			 * **Non-Matches**
			 * 		<img src=â€�img.jpgâ€� alt=â€�My image>â€� /> (attributes canâ€™t contain greater than signs)
			 * 
			 * [Source](http://net.tutsplus.com/tutorials/other/8-regular-expressions-you-should-know/)
			 * @private
			 */
			htmlTag: {
				value:		config.htmlTag || /^<([a-z]+)([^<]+)*(?:>(.*)<\/\1>|\s+\/>)$/,
				enumerable:	true,
				writable:	false
			},
			/**
			 * @method isHtmlTag
			 * Indicates the match is an HTML tag.
			 * @param {String} text
			 * The string to match.
			 * @returns {Boolean}
			 */
			
			/**
			 * @property {RegExp} mobileDevice
			 * A custom implementation detecting mobile devices with [detectmobilebrowser.com](http://detectmobilebrowser.com).
			 */
			_mobileDevice: {
				value:		config.mobileDevice || null,
				enumerable:	true,
				writable:	false
			}
			
		};
		
		Object.defineProperties(this,props);
		
		// Create isFn() method for each property
		var me = this;
		for(var el in props){
			if (props.hasOwnProperty(el) && el.substr(0,1) !== '_'){
				Object.defineProperty(this,'is'+el.substr(0,1).toUpperCase()+el.substr(1,el.length-1),{
					enumerable: true,
					writable:	false,
					value:		function(v){ if(me[el] !== null) return me[el].test(v); else return false; }
				})
			}
		}
		
	},
	
	/**
	 * @method
	 * Provides the similar functionality to RegExp#test. Given a RegExp, it will test a value or
	 * array of values to see if they match a pattern. If an array is provided, it will loop through
	 * the array, testing each element along the way. If _any_ element of the array does not match
	 * the pattern, it will return `false`. If _all_ values match the pattern, it will return `true`. 
	 * 
	 * **Example**
	 * 		var pattern = new NGN.Patterns();
	 * 		
	 * 		console.log(pattern.is(/\<b\>(.*)\<\/b\>/,'<b>Hello</b>')); // --> Outputs true.
	 * 		
	 * 		console.log(pattern.is(/\<b\>(.*)\<\/b\>/,['<b>Hello</b>','<b>World</b>'])); // --> Outputs true.
	 * 		
	 * 		console.log(pattern.is(/\<b\>(.*)\<\/b\>/,['<b>Hello</b>','World'])); // --> Outputs false. Second array item does not match.
	 * 		
	 * @param {RegExp} regex
	 * @param {String/Array} value
	 * @returns {Boolean}
	 */
	is: function(regex,value){
		return regex.test(value);
	},
	
	/**
	 * @method
	 * Indicates the user agent is a mobile device.
	 * @param {String} value
	 * The user agent string.
	 */
	isMobileDevice: function(value) {
		
		if (this._mobileDevice !== null)
			return this._mobileDevice.test(value);
		
		return 	/android|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(ad|hone|od)|playbook|silk|iris|kindle|lge |maemo|meego.+mobile|midp|mmp|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i.test(value)
				|| /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(di|rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(value.substr(0,4));
	}
	
});

module.exports = Class;
