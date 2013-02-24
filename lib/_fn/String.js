/**
 * @class NGN.string
 * @experimental
 * @singleton
 * @extends functionlib
 * A common string manipulation library.
 * 
 *      NGN.string.capitalize('something'); // --> Something
 * 
 */
module.exports = {
	
	/**
	 * @method
	 * Capitalizes a string.
	 * @param {String} words
	 * The words or sentence that will be capitalized.
	 * @param {Boolean} [firstWordOnly=false]
	 * Only capitalize the first word detected in a sentence.
	 * @returns {String}
	 * Returns the word, words, or sentence with modified case.
	 */
	capitalize: function(words,firstWordOnly){
		firstWordOnly = firstWordOnly || false;
		
		if (firstWordOnly)
			return words.substr(0,1).toUpperCase()+words.substr(1,words.length-1);
		else {
			var str = words.split(" ");
			for (var i=0;i<str.length;i++)
				str[i] = str[i].substr(0,1).toUpperCase()+str[i].substr(1,str[i].length-1);
			return str.join(' ');
		}	
	},
	
	/**
	 * @method
	 * Uncapitalizes a string.
	 * @param {String} words
	 * The words or sentence that will be uncapitalized.
	 * @param {Boolean} [firstWordOnly=false]
	 * Only uncapitalize the first word detected in a sentence.
	 * @returns {String}
	 * Returns the word, words, or sentence with modified case.
	 */
	uncapitalize: function(words,firstWordOnly){
		firstWordOnly = firstWordOnly || false;
		
		if (firstWordOnly)
			return words.substr(0,1).toLowerCase()+words.substr(1,words.length-1);
		else {
			var str = words.split(" ");
			for (var i=0;i<str.length;i++)
				str[i] = str[i].substr(0,1).toLowerCase()+str[i].substr(1,str[i].length-1);
			return str.join(' ');
		}	
	},
	
	/**
	 * @method
	 * Truncate a string to fit within the specified length of characters.
	 * @param {String} word
	 * @param {Number} length
	 */
	truncate: function(word,length) {
		return word.substr(0,length) || word;
	},
	
	/**
	 * @method
   * (Right) Pads the string with the specified number of characters.
   * Padding characters is added to the right of the word.
	 * @param {String} word
	 * @param {Number} padLength
	 * @param {String} [padCharacter=' ']
	 */
	lpad: function(word, padLength, padCharacter){
		padCharacter = padCharacter || ' ';
		padLength = padLength || 0;
		
		while (padLength > 0){
		  padLength--;
			word = padCharacter+word;
		}
		return word;
	},
  
  /**
   * @method
   * (Right) Pads the string with the specified number of characters.
   * Padding characters is added to the right of the word.
   * @param {String} word
   * @param {Number} padLength
   * @param {String} [padCharacter=' ']
   */
  rpad: function(word, padLength, padCharacter){
    padCharacter = padCharacter || ' ';
    padLength = padLength || 0;
    
    while (padLength > 0){
      padLength--;
      word += padCharacter;
    }
    
    return word;
  },
  
  
  /**
   * @method
   * (Center) Pads the string with the specified number of characters.
   * Padding characters is added equally to the right and left of the word.
   * @param {String} word
   * @param {Number} padLength
   * @param {String} [padCharacter=' ']
   */
  cpad: function(word, padLength, padCharacter){
    padCharacter = padCharacter || ' ';
    padLength = padLength || 0;
    
    while (padLength > 0){
      padLength--;
      word = padCharacter+word+padCharacter;
    }
    
    return word;
  },
  
	/**
	 * @method
	 * Centers the string within the given width. 
	 * Padded characters are applied equally to the right and left of the word.
	 * Padding is added alternately on the left and right, starting with the left by default.
	 * @param {String} word
	 * @param {Number} totalLength
	 * The total number of characters (word+padding) for the output.
	 * @param {String} [fillCharacter=' ']
	 * @param {Boolean} [beginLeft=true]
	 * Padded characters are added in a Left-Right-Left-Right-etc pattern by default. Set this to `false`
	 * to switch to Right-Left-Right-Left-etc.
	 */
	center: function(word, totalLength, fillCharacter, beginLeft){
		fillCharacter = fillCharacter || ' ';
		totalLength = totalLength || word.length || 0;
		word = word || '';
		beginLeft = __NGN.coalesce(beginLeft,true);
		
		var  chars = totalLength-word.length,
	       extra = chars%2;
		
		if (chars <= 0){
		  return word;
		}
			
		chars -= extra;
		chars = chars/2;

		for(var i=0;i<chars;i++)
			word += fillCharacter;
		for(var i=0;i<chars;i++)
			word = fillCharacter + word;
		if (extra == 1)
			word = beginLeft == true ? fillCharacter + word : word + fillCharacter;
		
		return word;
	},
	
	/**
	 * @method
	 * Wrap the specified word/s with a character(s).
	 * @param {String/String[]} word
	 * A word or array of words.
	 * @param {String} [characters='"']
	 */
	quote: function(word,chars){
		chars = chars || "\"";
		if (Array.isArray(word)){
			for (var i=0;i<word.length;i++)
				word[i] = chars+word[i]+chars;
			return word;
		}
		return chars+word+chars;
	}
}
