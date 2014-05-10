/**
* jQuery Lightweight Client Side Language Translator!
*
* @author shibyville
* @version 0.0.1
*
* @copyright
* Copyright (C) 2014 shibyville.
*
* @link
* http://send-a-wow.org
*
* @license
* Licensed under the MIT Licence.
*/
(function ( $ ) {
    $.fn.lcstranslate = function( settings ) {
        // Default options.
        var options = $.extend({
            languagefile      : "",
			languages : [{ 
							code : "", //e.g. en-GB (or 'default' if html site is used)
							name : ""  //e.g. English
						}]
        }, settings );
		languages = options['languages'];

		/**
         * Function: give an url where we can get the languagefile
         * function returns an array multidemsional array with two values: selector, value
         */
        function prepareLanguagefile(languagefile) {
             $.ajax({
                url: languagefile,
                type: 'get',
                dataType: 'text',
                async: false,
                success: function(language) {
                        
                    langObj = new Array();
                    //put the lines into an array
                    lines = language.match(/^.*([\n\r]+|$)/gm);
                    
                    for (i in lines) {
                        //if the line begins with an ";" we skip it (comment)
                        if(lines[i].charAt(0) == ";") {
                            continue;
                        }
                        //split line into two parts, the key and the language value
                        key = lines[i].substring(0, lines[i].indexOf(':'));
                        text = lines[i].substring(lines[i].indexOf(':')+1);
                        key = key.trim(); text = text.trim();
                        
                        //if the line begins with a '#' we use the id as a selector
                        if (key.charAt(0) == '#') {
                            selector = '#'+key ;
                        } else if (key.charAt(0) == '.') { //if the line begins with a '#' we use the id as a selector
                            selector = '.'+key ;
                        } else {//create the selector string - we use data-langstring by default
                            selector = '[data-langstring="'+key+'"]:first';
                        }
                        
                        //push the selector and text into the language array
                        langObj.push({
                                        selector : selector,
                                        text : text
                                     });
                    }
                    
                }
            });
            
            return langObj;
        }

        //for each element
        $(this).each(function () {
			element = $(this);
			
			//add language selector if needed
			langselectClass = "lclst-selector";
			langSelectObj = $(this).find('.' + langselectClass);
			
			if (!($(langSelectObj).hasClass(langselectClass))) {
                langselectwrapper = $('<div class="lclst-selector-wrapper"></div>');
				langselect = '<label>Translate text into...</label>\
                                <select class="' + langselectClass + '" size="1"></select>\
                            ';
                $(langselectwrapper).html(langselect);
				$(this).prepend(langselectwrapper);
                
				langSelectObj = $(this).find('.' + langselectClass);
				//add the languages
				for (i in languages) {
					//select default language here!
					//if default - it is the selected
					selected = ""
					if (languages[i]['defaultlang']) {
						selected = 'selected="selected"';
                        defaultlang = languages[i]['code'];
					}
                    countrycode = languages[i]['code'].slice(-2).toLowerCase();
                    option = $('<option value="' + languages[i]['code'] + '" ' + selected + '>' + languages[i]['name'] + '</option>');
					$(option).prepend('<img src="./languages/flags/flag-' + countrycode + '.png" />')
                    $(langSelectObj).append(option);
                }
				
				$(langSelectObj).on("change", function () {
					
					//reload on default - this will load the default language too
					if ($(this).val() == defaultlang) {
						location.reload();
						return false;
					}
					languagefile = "./languages/" + $(this).val() + "/" + $(this).val() + ".ini";
					
					$(element).lcstranslate(languagefile);
				});
			}

			
			//if no languagefile is given, we do nothing
			if(typeof languagefile === 'undefined') {
				return;
			} else {
			    //load the language file
				language = prepareLanguagefile(languagefile);
			}
			
            for (i=0;i < language.length; i++) {
                // get selector and text from current line
                selector = language[i]['selector'];
                text     = language[i]['text'];
                
                //Search the element an set the new value to it
                //if the element has no children, we can do the easy way
                if(!($(selector).has('*').length)) {
                    $(selector).html(text);
                }
                else { //else we scan the element for tags
                    /*
                     *  <TAG> There is a tag but you do not know what. But you want keep it as is.
                     *  Example: Here you see a pic <TAG> which shows a dog. Here <TAG#id> is another one.
                     *  If none id is give, the tags are worked off in order as a fall back.
                     */
                    tagregexp = /<TAG(#[\S]+)?>/g //find all <TAG> or <TAG#xyz>
                    //split the language value into tags and text
                    tags = text.match(tagregexp);
                    text = text.split(tagregexp);
                    
                    //allocate the tags in order with child elements
                    if(tags) {
                        x=0;
                        for (z=0;z < tags.length; z++) {
                            console.log("TAG Nummer " + z);
                            countChildren = $(selector).children().length;
                            //only select it if it has a data-language attribute
                            while(x < countChildren) {
                                child = $(selector).children(':eq('+ x +')');
                                console.log("Child Nummer" + x);
                                if($(child).is("[data-langstring]") || $(child).prop("tagName") == "A") {
                                    tags[z] = $(child);
                                    x=x+1;
                                    break;
                                }
                                x=x+1;
                            }
                        }
                    }
                    console.log(tags)
                    console.log(text)
                    //fill the element with translated stuff 
                    //if first elements are tags, we begin with it, 
                    //for some reason in that case text is empty
                    //we can do the easy way again, if no tags are found
                    if(!(tags)) {
                        $(selector).html(text);
                    } else {
                        $(selector).empty();
                        
                        for (z=0;z < tags.length; z++) {
                            if (text[0] != "" ) {
                                $(selector).append(text[z*2]);
                                $(selector).append($(tags[z]));
                            }
                            if (text[0] == "" ) {
                                $(selector).append($(tags[z]));
                                $(selector).append(text[(z*2)+2]);
                            }
                        }
                        //if there is still text we append it too.
                        if (text[0] != "" ) {
                            //dev not z is + 1 so we do not use the same index with z*2
                            if(!(typeof text[z*2] == "undefined")) {
                                $(selector).append(text[(z*2)]); 
                            }
                        }
                    }
                
                }
             
                //TODO: HIDDEN ELEMENTS - create function for event when a hidden element is shown
            }
			
			
        });
    }
}( jQuery ));