/**
 * @class $
 */
module.exports = {
	
	/**
	 * @method
	 * Capitalizes a string. This metho 
	 * @param {String} words
	 * The words or sentence that will be capitalized.
	 * @param {Boolean} [firstWordOnly=false]
	 * Only capitalize the first word detected in a sentence.
	 * @returns {String}
	 * Returns the words or sentence with modified case.
	 */
	capitalize: function(words,firstWordOnly){
		firstWordOnly = firstWordOnly || false;
		
		if (firstWordOnly)
			return words.substr(0,1)+words.substr(1,words.length-1);
		else {
			var str = words.split(" ");
			for (var i=0;i<str.length;i++)
				str[i] = str[i].substr(0,1)+str[i].substr(1,str[i].length-1);
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
	 * (Left) Pads the string with the specified character until the total character length
	 * equals the desired length. Padded characters are added to the left of the word.
	 * @param {String} word
	 * @param {Number} characterLength
	 * @param {String} [padCharacter=' ']
	 */
	lpad: function(word, characterLength, padCharacter){
		padCharacter = padCharacter || ' ';
		characterLength = characterLength || word.length || 0;
		word = word || '';
		
		while (word.length < characterLength){
			word = padCharacter+word;
		}
	},
	
	/**
	 * @method
	 * (Right) Pads the string with the specified character until the total character length
	 * equals the desired length. Padded characters are added to the right of the word.
	 * @param {String} word
	 * @param {Number} characterLength
	 * @param {String} [padCharacter=' ']
	 */
	rpad: function(word, characterLength, padCharacter){
		padCharacter = padCharacter || ' ';
		characterLength = characterLength || word.length || 0;
		word = word || '';
		
		while (word.length < characterLength){
			word += padCharacter;
		}
		
		return word;
	},
	
	/**
	 * @method
	 * (Center) Pads the string with the specified character until the total character length
	 * equals the desired length. Padded characters are added equally to the right and left of the word.
	 * Padding is added alternately on the left and right, starting with the left by default.
	 * @param {String} word
	 * @param {Number} characterLength
	 * @param {String} [padCharacter=' ']
	 * @param {Boolean} [beginLeft=true]
	 * Padded characters are ladded in a Left-Right-Left-Right-etc pattern by default. Set this to `false`
	 * to switch to Right-Left-Right-Left-etc.
	 */
	cpad: function(word, characterLength, padCharacter){
		padCharacter = padCharacter || ' ';
		characterLength = characterLength || word.length || 0;
		word = word || ''
		beginLeft = __NGN.coalesce(beginLeft,true);
		
		var chars = characterLength-word.length,
			extra = chars%2;
			
		chars -= extra;
		
		for(var i=0;i<chars;i++)
			word += padCharacter;
		for(var i=0;i<chars;i++)
			word = padCharacter + word;
		if (extra == 1)
			word = beginLeft == true ? padCharacter + word : word + padCharacter;
		
		return word;
	},
	
	/**
	 * @method
	 * Wrap quotes around the specified word/s.
	 * @param {String/String[]} word
	 * A word or array of words.
	 */
	quote: function(word){
		if (Array.isArray(word)){
			for (var i=0;i<word.length;i++)
				word[i] = '"'+word[i]+'"';
			return word;
		}
		return '"'+word+'"';
	},
	
	/**
	 * @method
	 * Wrap the specified word/s with a character(s).
	 * @param {String/String[]} word
	 * A word or array of words.
	 * @param {String} character(s)
	 */
	quote: function(word,chars){
		if (Array.isArray(word)){
			for (var i=0;i<word.length;i++)
				word[i] = chars+word[i]+chars;
			return word;
		}
		return chars+word+chars;
	}
}
