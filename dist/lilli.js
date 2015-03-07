/*! lilli.js - v1.0.0 - 2015-03-07
* Copyright (c) 2015 Sven Koelpin; Licensed MIT */
window.Lilly = (function (w, d, jsf, undefined) {
    "use strict";
    if (jsf === undefined) {
        throw "JSF needs to be loaded before lilli";
    }
    var oldRequestFn = jsf.ajax.request;
    var executeOptions, executeSource;

    var arrayContains = function (array, value) {
        for (var i = 0, length = array.length; i < length; i++) {
            if (value === array[i]) {
                return true;
            }
        }
        return false;
    };

    //override the request function
    jsf.ajax.request = function (source, event, options) {
        //temporarily store the execute-options
        //to use them in the getViewState-function
        setExecuteOptions(options.execute);
        setExecuteSrc(source);
        //call the old request function. this method will call
        //the getViewState-function
        oldRequestFn(source, event, options);
    };

    //override the getViewState-function. We actually use the
    //default mojarra-implementation and just enhance it by a few lines
    //to just submit the values that are set in the options.execute-string
    //!!!most of this code it just copied from the default mojarra jsf.js!!!!
    jsf.getViewState = function (form) {
        if (!form) {
            throw new Error("jsf.getViewState:  form must be set");
        }
        var els = form.elements;
        var len = els.length;
        var qString = [];

        var formElementMap = {};
        var executeIds, executeForm, executeNone, executeAll, i, length;

        for (i = 0; i < len; i++) {
            formElementMap[els[i].name] = true;
        }
        //check if the execute-attribute was set
        if (executeOptions) {
            executeIds = executeOptions.split(/[ ]+/);
            //workaround for execute @this
            executeIds.push(executeSource.name);
            executeNone = executeOptions.search(/@none/) >= 0;
            executeAll = executeOptions.search(/@all/) >= 0;
            executeForm = executeOptions.search(/@form/) >= 0 || arrayContains(executeIds, form.name);
            if (!executeAll && !executeForm) {
                //check if the execute-ids are form elements or keywords. if not, fallback to jsfs' default behaviour
                //since searching for all child elements is a performance drawback
                for (i = 0, length = executeIds.length; i < length; i++) {
                    if (executeIds[i] !== "@this" && executeIds[i] !== "@none" && !formElementMap[executeIds[i]]) {
                        executeForm = true;
                        break;
                    }

                }
            }
        }
        //if not, check if the eventsource is sth other than a formelement (e.g. a div or span)
        //if so, we need to fall back to jsfs' default behavior and submit the whole form
        else {
            if (!arrayContains(els, executeSource)) {
                executeForm = true;
            }
        }
        //this method checks whether the given element-name is part of the "execute" property of the ajax request
        var isFieldExecutable = function (name) {
            //the ViewState-value is always submitted
            if (name === "javax.faces.ViewState") {
                return true;
            }
            //submit nothing if execute @none is set
            if (executeNone) {
                return false;
            }
            //submit all values if @all or @form is set as execute option
            if (executeAll || executeForm) {
                return true;
            }
            //form-name is always submitted (if execute @none is not set)
            if (name === form.name) {
                return true;
            }

            //no execute string was set
            if (!executeIds) {
                return false;
            }

            //check whether the given element-name was set in the "execute" section of the ajax request
            return arrayContains(executeIds, name);
        };
        var addField = function (name, value) {
            //check if the element is part of the "execute"-option before adding it to the request string
            var fieldExecutable = isFieldExecutable(name);
            if (fieldExecutable) {
                var tmpStr = "";
                if (qString.length > 0) {
                    tmpStr = "&";
                }
                tmpStr += encodeURIComponent(name) + "=" + encodeURIComponent(value);
                qString.push(tmpStr);
            }
        };
        for (i = 0; i < len; i++) {
            var el = els[i];
            if (el.name === "") {
                continue;
            }
            if (!el.disabled) {
                switch (el.type) {
                    case "button":
                    case "submit":
                    case "reset":
                    case "image":
                    case "file":
                        break;
                    case "select-one":
                        if (el.selectedIndex >= 0) {
                            addField(el.name, el.options[el.selectedIndex].value);
                        }
                        break;
                    case "select-multiple":
                        for (var j = 0; j < el.options.length; j++) {
                            if (el.options[j].selected) {
                                addField(el.name, el.options[j].value);
                            }
                        }
                        break;
                    case "checkbox":
                    case "radio":
                        if (el.checked) {
                            addField(el.name, el.value || "on");
                        }
                        break;
                    default:
                        var nodeName = el.nodeName.toLowerCase();
                        if (nodeName === "input" || nodeName === "select" ||
                            nodeName === "object" || nodeName === "textarea") {
                            addField(el.name, el.value);
                        }
                        break;
                }
            }
        }
        //reset the options
        executeOptions = null;
        executeSource = null;
        return qString.join("");
    };


    var setExecuteOptions = function (opts) {
        executeOptions = opts;
    };
    var setExecuteSrc = function (src) {
        executeSource = src;
    };

    //this is needed to make lilly testable..
    return{
        _setExecuteOptions: setExecuteOptions,
        _setExecuteSrc: setExecuteSrc
    };
}(window, window.document, window.jsf));