/*
 * DO NOT ALTER OR REMOVE COPYRIGHT NOTICES OR THIS HEADER.
 *
 * Copyright 1997-2013 Sun Microsystems, Inc. All rights reserved.
 *
 * The contents of this file are subject to the terms of either the GNU
 * General Public License Version 2 only ("GPL") or the Common Development
 * and Distribution License("CDDL") (collectively, the "License").  You
 * may not use this file except in compliance with the License. You can obtain
 * a copy of the License at https://glassfish.dev.java.net/public/CDDL+GPL.html
 * or glassfish/bootstrap/legal/LICENSE.txt.  See the License for the specific
 * language governing permissions and limitations under the License.
 *
 * When distributing the software, include this License Header Notice in each
 * file and include the License file at glassfish/bootstrap/legal/LICENSE.txt.
 * Sun designates this particular file as subject to the "Classpath" exception
 * as provided by Sun in the GPL Version 2 section of the License file that
 * accompanied this code.  If applicable, add the following below the License
 * Header, with the fields enclosed by brackets [] replaced by your own
 * identifying information: "Portions Copyrighted [year]
 * [name of copyright owner]"
 *
 * Contributor(s):
 *
 * If you wish your version of this file to be governed by only the CDDL or
 * only the GPL Version 2, indicate your decision by adding "[Contributor]
 * elects to include this software in this distribution under the [CDDL or GPL
 * Version 2] license."  If you don't indicate a single choice of license, a
 * recipient has the option to distribute your version of this file under
 * either the CDDL, the GPL Version 2 or to extend the choice of license to
 * its licensees as provided above.  However, if you add GPL Version 2 code
 * and therefore, elected the GPL Version 2 license, then the option applies
 * only if the new code is made subject to such option by the copyright
 * holder.
 *
 *
 * This file incorporates work covered by the following copyright and
 * permission notices:
 *
 * Copyright 2004 The Apache Software Foundation
 * Copyright 2004-2008 Emmanouil Batsis, mailto: mbatsis at users full stop sourceforge full stop net
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 @project JSF JavaScript Library
 @version 2.2
 @description This is the standard implementation of the JSF JavaScript Library.
 */

/**
 * Register with OpenAjax
 */
if (typeof OpenAjax !== "undefined" &&
    typeof OpenAjax.hub.registerLibrary !== "undefined") {
    OpenAjax.hub.registerLibrary("jsf", "www.sun.com", "2.2", null);
}

// Detect if this is already loaded, and if loaded, if it's a higher version
if (!((jsf && jsf.specversion && jsf.specversion >= 20000 ) &&
    (jsf.implversion && jsf.implversion >= 3))) {

    /**
     * <span class="changed_modified_2_2">The top level global namespace
     * for JavaServer Faces functionality.</span>

     * @name jsf
     * @namespace
     */
    var jsf = {};

    /**

     * <span class="changed_modified_2_2">The namespace for Ajax
     * functionality.</span>

     * @name jsf.ajax
     * @namespace
     * @exec
     */
    jsf.ajax = function () {

        var eventListeners = [];
        var errorListeners = [];

        var delayHandler = null;
        /**
         * Determine if the current browser is part of Microsoft's failed attempt at
         * standards modification.
         * @ignore
         */
        var isIE = function isIE() {
            if (typeof isIECache !== "undefined") {
                return isIECache;
            }
            isIECache =
                document.all && window.ActiveXObject &&
                    navigator.userAgent.toLowerCase().indexOf("msie") > -1 &&
                    navigator.userAgent.toLowerCase().indexOf("opera") == -1;
            return isIECache;
        };
        var isIECache;

        /**
         * Determine the version of IE.
         * @ignore
         */
        var getIEVersion = function getIEVersion() {
            if (typeof IEVersionCache !== "undefined") {
                return IEVersionCache;
            }
            if (/MSIE ([0-9]+)/.test(navigator.userAgent)) {
                IEVersionCache = parseInt(RegExp.$1);
            } else {
                IEVersionCache = -1;
            }
            return IEVersionCache;
        }
        var IEVersionCache;

        /**
         * Determine if loading scripts into the page executes the script.
         * This is instead of doing a complicated browser detection algorithm.  Some do, some don't.
         * @returns {boolean} does including a script in the dom execute it?
         * @ignore
         */
        var isAutoExec = function isAutoExec() {
            try {
                if (typeof isAutoExecCache !== "undefined") {
                    return isAutoExecCache;
                }
                var autoExecTestString = "<script>var mojarra = mojarra || {};mojarra.autoExecTest = true;</script>";
                var tempElement = document.createElement('span');
                tempElement.innerHTML = autoExecTestString;
                var body = document.getElementsByTagName('body')[0];
                var tempNode = body.appendChild(tempElement);
                if (mojarra && mojarra.autoExecTest) {
                    isAutoExecCache = true;
                    delete mojarra.autoExecTest;
                } else {
                    isAutoExecCache = false;
                }
                deleteNode(tempNode);
                return isAutoExecCache;
            } catch (ex) {
                // OK, that didn't work, we'll have to make an assumption
                if (typeof isAutoExecCache === "undefined") {
                    isAutoExecCache = false;
                }
                return isAutoExecCache;
            }
        };
        var isAutoExecCache;

        /**
         * @ignore
         */
        var getTransport = function getTransport(context) {
            var returnVal;
            // Here we check for encoding type for file upload(s).
            // This is where we would also include a check for the existence of
            // input file control for the current form (see hasInputFileControl
            // function) but IE9 (at least) seems to render controls outside of
            // form.
            if (typeof context !== 'undefined' && context !== null &&
                context.form.enctype === "multipart/form-data") {
                returnVal = new FrameTransport(context);
                return returnVal;
            }
            var methods = [
                function () {
                    return new XMLHttpRequest();
                },
                function () {
                    return new ActiveXObject('Msxml2.XMLHTTP');
                },
                function () {
                    return new ActiveXObject('Microsoft.XMLHTTP');
                }
            ];

            for (var i = 0, len = methods.length; i < len; i++) {
                try {
                    returnVal = methods[i]();
                } catch (e) {
                    continue;
                }
                return returnVal;
            }
            throw new Error('Could not create an XHR object.');
        };

        /**
         * Used for iframe based communication (instead of XHR).
         * @ignore
         */
        var FrameTransport = function FrameTransport(context) {
            this.context = context;
            this.frame = null;
            this.FRAME_ID = "JSFFrameId";
            this.FRAME_PARTIAL_ID = "Faces-Request";
            this.partial = null;
            this.aborted = false;
            this.responseText = null;
            this.responseXML = null;
            this.readyState = 0;
            this.requestHeader = {};
            this.status = null;
            this.method = null;
            this.url = null;
            this.requestParams = null;
        };

        /**
         * Extends FrameTransport an adds method functionality.
         * @ignore
         */
        FrameTransport.prototype = {

            /**
             *@ignore
             */
            setRequestHeader: function (key, value) {
                if (typeof(value) !== "undefined") {
                    this.requestHeader[key] = value;
                }
            },

            /**
             * Creates the hidden iframe and sets readystate.
             * @ignore
             */
            open: function (method, url, async) {
                this.method = method;
                this.url = url;
                this.async = async;
                this.frame = document.getElementById(this.FRAME_ID);
                if (this.frame) {
                    this.frame.parentNode.removeChild(this.frame);
                    this.frame = null;
                }
                if (!this.frame) {
                    if ((!isIE() && !isIE9Plus())) {
                        this.frame = document.createElement('iframe');
                        this.frame.src = "about:blank";
                        this.frame.id = this.FRAME_ID;
                        this.frame.name = this.FRAME_ID;
                        this.frame.type = "content";
                        this.frame.collapsed = "true";
                        this.frame.style = "visibility:hidden";
                        this.frame.width = "0";
                        this.frame.height = "0";
                        this.frame.style = "border:0";
                        this.frame.frameBorder = 0;
                        document.body.appendChild(this.frame);
                        this.frame.onload = bind(this, this.callback);
                    } else {
                        var div = document.createElement("div");
                        div.id = "frameDiv";
                        div.innerHTML = "<iframe id='" + this.FRAME_ID + "' name='" + this.FRAME_ID + "' style='display:none;' src='about:blank' type='content' onload='this.onload_cb();'  ></iframe>";
                        document.body.appendChild(div);
                        this.frame = document.getElementById(this.FRAME_ID);
                        this.frame.onload_cb = bind(this, this.callback);
                    }
                }
                // Create to send "Faces-Request" param with value "partial/ajax"
                // For iframe approach we are sending as request parameter
                // For non-iframe (xhr ajax) it is sent in the request header
                this.partial = document.createElement("input");
                this.partial.setAttribute("type", "hidden");
                this.partial.setAttribute("id", this.FRAME_PARTIAL_ID);
                this.partial.setAttribute("name", this.FRAME_PARTIAL_ID);
                this.partial.setAttribute("value", "partial/ajax");
                this.context.form.appendChild(this.partial);

                this.readyState = 1;
            },

            /**
             * Sets the form target to iframe, sets up request parameters
             * and submits the form.
             * @ignore
             */
            send: function (data) {
                var evt = {};
                this.context.form.target = this.frame.name;
                this.context.form.method = this.method;
                if (this.url) {
                    this.context.form.action = this.url;
                }

                this.readyState = 3;

                this.onreadystatechange(evt);

                var ddata = decodeURIComponent(data);
                var dataArray = ddata.split("&");
                var input;
                this.requestParams = new Array();
                for (var i = 0; i < dataArray.length; i++) {
                    var nameValue = dataArray[i].split("=");
                    if (nameValue[0] === "javax.faces.source" ||
                        nameValue[0] === "javax.faces.partial.event" ||
                        nameValue[0] === "javax.faces.partial.execute" ||
                        nameValue[0] === "javax.faces.partial.render" ||
                        nameValue[0] === "javax.faces.partial.ajax" ||
                        nameValue[0] === "javax.faces.behavior.event") {
                        input = document.createElement("input");
                        input.setAttribute("type", "hidden");
                        input.setAttribute("id", nameValue[0]);
                        input.setAttribute("name", nameValue[0]);
                        input.setAttribute("value", nameValue[1]);
                        this.context.form.appendChild(input);
                        this.requestParams.push(nameValue[0]);
                    }
                }
                this.requestParams.push(this.FRAME_PARTIAL_ID);
                this.context.form.submit();
            },

            /**
             *@ignore
             */
            abort: function () {
                this.aborted = true;
            },

            /**
             *@ignore
             */
            onreadystatechange: function (evt) {

            },

            /**
             * Extracts response from iframe document, sets readystate.
             * @ignore
             */
            callback: function () {
                if (this.aborted) {
                    return;
                }
                var iFrameDoc;
                var docBody;
                try {
                    var evt = {};
                    iFrameDoc = this.frame.contentWindow.document ||
                        this.frame.contentDocument || this.frame.document;
                    docBody = iFrameDoc.body || iFrameDoc.documentElement;
                    this.responseText = docBody.innerHTML;
                    this.responseXML = iFrameDoc.XMLDocument || iFrameDoc;
                    this.status = 201;
                    this.readyState = 4;

                    this.onreadystatechange(evt);
                } finally {
                    this.cleanupReqParams();
                }
            },

            /**
             *@ignore
             */
            cleanupReqParams: function () {
                for (var i = 0; i < this.requestParams.length; i++) {
                    var elements = this.context.form.childNodes;
                    for (var j = 0; j < elements.length; j++) {
                        if (!elements[j].type === "hidden") {
                            continue;
                        }
                        if (elements[j].name === this.requestParams[i]) {
                            var node = this.context.form.removeChild(elements[j]);
                            node = null;
                            break;
                        }
                    }
                }
            }
        };


        /**
         *Utility function that binds function to scope.
         *@ignore
         */
        var bind = function (scope, fn) {
            return function () {
                fn.apply(scope, arguments);
            };
        };

        /**
         * Utility function that determines if a file control exists
         * for the form.
         * @ignore
         */
        var hasInputFileControl = function (form) {
            var returnVal = false;
            var inputs = form.getElementsByTagName("input");
            if (inputs !== null && typeof inputs !== "undefined") {
                for (var i = 0; i < inputs.length; i++) {
                    if (inputs[i].type === "file") {
                        returnVal = true;
                        break;
                    }
                }
            }
            return returnVal;
        };

        /**
         * Find instance of passed String via getElementById
         * @ignore
         */
        var $ = function $() {
            var results = [], element;
            for (var i = 0; i < arguments.length; i++) {
                element = arguments[i];
                if (typeof element == 'string') {
                    element = document.getElementById(element);
                }
                results.push(element);
            }
            return results.length > 1 ? results : results[0];
        };

        /**
         * Get the form element which encloses the supplied element.
         * @param element - element to act against in search
         * @returns form element representing enclosing form, or first form if none found.
         * @ignore
         */
        var getForm = function getForm(element) {
            if (element) {
                var form = $(element);
                while (form) {

                    if (form.nodeName && (form.nodeName.toLowerCase() == 'form')) {
                        return form;
                    }
                    if (form.form) {
                        return form.form;
                    }
                    if (form.parentNode) {
                        form = form.parentNode;
                    } else {
                        form = null;
                    }
                }
                return document.forms[0];
            }
            return null;
        };

        /**
         * Get the form element which encloses the supplied element
         * identified by the supplied identifier.
         * @param id - the element id to act against in search
         * @returns form element representing enclosing form, or null if not found.
         * @ignore
         */
        var getFormForId = function getFormForId(id) {
            if (id) {
                var node = document.getElementById(id);
                while (node) {
                    if (node.nodeName && (node.nodeName.toLowerCase() == 'form')) {
                        return node;
                    }
                    if (node.form) {
                        return node.form;
                    }
                    if (node.parentNode) {
                        node = node.parentNode;
                    } else {
                        node = null;
                    }
                }
            }
            return null;
        };

        /**
         * Check if a value exists in an array
         * @ignore
         */
        var isInArray = function isInArray(array, value) {
            for (var i = 0; i < array.length; i++) {
                if (array[i] === value) {
                    return true;
                }
            }
            return false;
        };


        /**
         * Evaluate JavaScript code in a global context.
         * @param src JavaScript code to evaluate
         * @ignore
         */
        var globalEval = function globalEval(src) {
            if (window.execScript) {
                window.execScript(src);
                return;
            }
            // We have to wrap the call in an anon function because of a firefox bug, where this is incorrectly set
            // We need to explicitly call window.eval because of a Chrome peculiarity
            /**
             * @ignore
             */
            var fn = function () {
                window.eval.call(window, src);
            };
            fn();
        };

        /**
         * Get all scripts from supplied string, return them as an array for later processing.
         * @param str
         * @returns {array} of script text
         * @ignore
         */
        var stripScripts = function stripScripts(str) {
            // Regex to find all scripts in a string
            var findscripts = /<script[^>]*>([\S\s]*?)<\/script>/igm;
            // Regex to find one script, to isolate it's content [2] and attributes [1]
            var findscript = /<script([^>]*)>([\S\s]*?)<\/script>/im;
            // Regex to remove leading cruft
            var stripStart = /^\s*(<!--)*\s*(\/\/)*\s*(\/\*)*\s*\n*\**\n*\s*\*.*\n*\s*\*\/(<!\[CDATA\[)*/;
            // Regex to find src attribute
            var findsrc = /src="([\S]*?)"/im;
            var findtype = /type="([\S]*?)"/im;
            var initialnodes = [];
            var scripts = [];
            initialnodes = str.match(findscripts);
            while (!!initialnodes && initialnodes.length > 0) {
                var scriptStr = [];
                scriptStr = initialnodes.shift().match(findscript);
                // check the type - skip if it not javascript type
                var type = [];
                type = scriptStr[1].match(findtype);
                if (!!type && type[1]) {
                    if (type[1] !== "text/javascript") {
                        continue;
                    }
                }
                var src = [];
                // check if src specified
                src = scriptStr[1].match(findsrc);
                var script;
                if (!!src && src[1]) {
                    // if this is a file, load it
                    var url = src[1];
                    // if this is another copy of jsf.js, don't load it
                    // it's never necessary, and can make debugging difficult
                    if (/\/javax.faces.resource\/jsf.js\?ln=javax\.faces/.test(url)) {
                        script = false;
                    } else {
                        script = loadScript(url);
                    }
                } else if (!!scriptStr && scriptStr[2]) {
                    // else get content of tag, without leading CDATA and such
                    script = scriptStr[2].replace(stripStart, "");
                } else {
                    script = false;
                }
                if (!!script) {
                    scripts.push(script);
                }
            }
            return scripts;
        };

        /**
         * Load a script via a url, use synchronous XHR request.  This is liable to be slow,
         * but it's probably the only correct way.
         * @param url the url to load
         * @ignore
         */
        var loadScript = function loadScript(url) {
            var xhr = getTransport(null);
            if (xhr === null) {
                return "";
            }

            xhr.open("GET", url, false);
            xhr.setRequestHeader("Content-Type", "application/x-javascript");
            xhr.send(null);

            // PENDING graceful error handling
            if (xhr.readyState == 4 && xhr.status == 200) {
                return xhr.responseText;
            }

            return "";
        };

        /**
         * Run an array of scripts text
         * @param scripts array of script nodes
         * @ignore
         */
        var runScripts = function runScripts(scripts) {
            if (!scripts || scripts.length === 0) {
                return;
            }

            var head = document.getElementsByTagName('head')[0] || document.documentElement;
            while (scripts.length) {
                // create script node
                var scriptNode = document.createElement('script');
                scriptNode.type = 'text/javascript';
                scriptNode.text = scripts.shift(); // add the code to the script node
                head.appendChild(scriptNode); // add it to the page
                head.removeChild(scriptNode); // then remove it
            }
        };

        /**
         * Replace DOM element with a new tagname and supplied innerHTML
         * @param element element to replace
         * @param tempTagName new tag name to replace with
         * @param src string new content for element
         * @ignore
         */
        var elementReplaceStr = function elementReplaceStr(element, tempTagName, src) {

            var temp = document.createElement(tempTagName);
            if (element.id) {
                temp.id = element.id;
            }

            // Creating a head element isn't allowed in IE, and faulty in most browsers,
            // so it is not allowed
            if (element.nodeName.toLowerCase() === "head") {
                throw new Error("Attempted to replace a head element - this is not allowed.");
            } else {
                var scripts = [];
                if (isAutoExec()) {
                    temp.innerHTML = src;
                } else {
                    // Get scripts from text
                    scripts = stripScripts(src);
                    // Remove scripts from text
                    src = src.replace(/<script[^>]*type="text\/javascript"*>([\S\s]*?)<\/script>/igm, "");
                    temp.innerHTML = src;
                }
            }

            replaceNode(temp, element);
            cloneAttributes(temp, element);
            runScripts(scripts);

        };

        /**
         * Get a string with the concatenated values of all string nodes under the given node
         * @param  oNode the given DOM node
         * @param  deep boolean - whether to recursively scan the children nodes of the given node for text as well. Default is <code>false</code>
         * @ignore
         * Note:  This code originally from Sarissa: http://dev.abiss.gr/sarissa
         * It has been modified to fit into the overall codebase
         */
        var getText = function getText(oNode, deep) {
            var Node = {ELEMENT_NODE: 1, ATTRIBUTE_NODE: 2, TEXT_NODE: 3, CDATA_SECTION_NODE: 4,
                ENTITY_REFERENCE_NODE: 5, ENTITY_NODE: 6, PROCESSING_INSTRUCTION_NODE: 7,
                COMMENT_NODE: 8, DOCUMENT_NODE: 9, DOCUMENT_TYPE_NODE: 10,
                DOCUMENT_FRAGMENT_NODE: 11, NOTATION_NODE: 12};

            var s = "";
            var nodes = oNode.childNodes;
            for (var i = 0; i < nodes.length; i++) {
                var node = nodes[i];
                var nodeType = node.nodeType;
                if (nodeType == Node.TEXT_NODE || nodeType == Node.CDATA_SECTION_NODE) {
                    s += node.data;
                } else if (deep === true && (nodeType == Node.ELEMENT_NODE ||
                    nodeType == Node.DOCUMENT_NODE ||
                    nodeType == Node.DOCUMENT_FRAGMENT_NODE)) {
                    s += getText(node, true);
                }
            }
            return s;
        };

        var PARSED_OK = "Document contains no parsing errors";
        var PARSED_EMPTY = "Document is empty";
        var PARSED_UNKNOWN_ERROR = "Not well-formed or other error";
        var getParseErrorText;
        if (isIE()) {
            /**
             * Note: This code orginally from Sarissa: http://dev.abiss.gr/sarissa
             * @ignore
             */
            getParseErrorText = function (oDoc) {
                var parseErrorText = PARSED_OK;
                if (oDoc && oDoc.parseError && oDoc.parseError.errorCode && oDoc.parseError.errorCode !== 0) {
                    parseErrorText = "XML Parsing Error: " + oDoc.parseError.reason +
                        "\nLocation: " + oDoc.parseError.url +
                        "\nLine Number " + oDoc.parseError.line + ", Column " +
                        oDoc.parseError.linepos +
                        ":\n" + oDoc.parseError.srcText +
                        "\n";
                    for (var i = 0; i < oDoc.parseError.linepos; i++) {
                        parseErrorText += "-";
                    }
                    parseErrorText += "^\n";
                }
                else if (oDoc.documentElement === null) {
                    parseErrorText = PARSED_EMPTY;
                }
                return parseErrorText;
            };
        } else { // (non-IE)

            /**
             * <p>Returns a human readable description of the parsing error. Useful
             * for debugging. Tip: append the returned error string in a &lt;pre&gt;
             * element if you want to render it.</p>
             * @param  oDoc The target DOM document
             * @returns {String} The parsing error description of the target Document in
             *          human readable form (preformated text)
             * @ignore
             * Note:  This code orginally from Sarissa: http://dev.abiss.gr/sarissa
             */
            getParseErrorText = function (oDoc) {
                var parseErrorText = PARSED_OK;
                if ((!oDoc) || (!oDoc.documentElement)) {
                    parseErrorText = PARSED_EMPTY;
                } else if (oDoc.documentElement.tagName == "parsererror") {
                    parseErrorText = oDoc.documentElement.firstChild.data;
                    parseErrorText += "\n" + oDoc.documentElement.firstChild.nextSibling.firstChild.data;
                } else if (oDoc.getElementsByTagName("parsererror").length > 0) {
                    var parsererror = oDoc.getElementsByTagName("parsererror")[0];
                    parseErrorText = getText(parsererror, true) + "\n";
                } else if (oDoc.parseError && oDoc.parseError.errorCode !== 0) {
                    parseErrorText = PARSED_UNKNOWN_ERROR;
                }
                return parseErrorText;
            };
        }

        if ((typeof(document.importNode) == "undefined") && isIE()) {
            try {
                /**
                 * Implementation of importNode for the context window document in IE.
                 * If <code>oNode</code> is a TextNode, <code>bChildren</code> is ignored.
                 * @param oNode the Node to import
                 * @param bChildren whether to include the children of oNode
                 * @returns the imported node for further use
                 * @ignore
                 * Note:  This code orginally from Sarissa: http://dev.abiss.gr/sarissa
                 */
                document.importNode = function (oNode, bChildren) {
                    var tmp;
                    if (oNode.nodeName == '#text') {
                        return document.createTextNode(oNode.data);
                    }
                    else {
                        if (oNode.nodeName == "tbody" || oNode.nodeName == "tr") {
                            tmp = document.createElement("table");
                        }
                        else if (oNode.nodeName == "td") {
                            tmp = document.createElement("tr");
                        }
                        else if (oNode.nodeName == "option") {
                            tmp = document.createElement("select");
                        }
                        else {
                            tmp = document.createElement("div");
                        }
                        if (bChildren) {
                            tmp.innerHTML = oNode.xml ? oNode.xml : oNode.outerHTML;
                        } else {
                            tmp.innerHTML = oNode.xml ? oNode.cloneNode(false).xml : oNode.cloneNode(false).outerHTML;
                        }
                        return tmp.getElementsByTagName("*")[0];
                    }
                };
            } catch (e) {
            }
        }
        // Setup Node type constants for those browsers that don't have them (IE)
        var Node = {ELEMENT_NODE: 1, ATTRIBUTE_NODE: 2, TEXT_NODE: 3, CDATA_SECTION_NODE: 4,
            ENTITY_REFERENCE_NODE: 5, ENTITY_NODE: 6, PROCESSING_INSTRUCTION_NODE: 7,
            COMMENT_NODE: 8, DOCUMENT_NODE: 9, DOCUMENT_TYPE_NODE: 10,
            DOCUMENT_FRAGMENT_NODE: 11, NOTATION_NODE: 12};

        // PENDING - add support for removing handlers added via DOM 2 methods
        /**
         * Delete all events attached to a node
         * @param node
         * @ignore
         */
        var clearEvents = function clearEvents(node) {
            if (!node) {
                return;
            }

            // don't do anything for text and comment nodes - unnecessary
            if (node.nodeType == Node.TEXT_NODE || node.nodeType == Node.COMMENT_NODE) {
                return;
            }

            var events = ['abort', 'blur', 'change', 'error', 'focus', 'load', 'reset', 'resize', 'scroll', 'select', 'submit', 'unload',
                'keydown', 'keypress', 'keyup', 'click', 'mousedown', 'mousemove', 'mouseout', 'mouseover', 'mouseup', 'dblclick' ];
            try {
                for (var e in events) {
                    if (events.hasOwnProperty(e)) {
                        node[e] = null;
                    }
                }
            } catch (ex) {
                // it's OK if it fails, at least we tried
            }
        };

        /**
         * Determine if this current browser is IE9 or greater
         * @param node
         * @ignore
         */
        var isIE9Plus = function isIE9Plus() {
            var iev = getIEVersion();
            if (iev >= 9) {
                return true;
            } else {
                return false;
            }
        }


        /**
         * Deletes node
         * @param node
         * @ignore
         */
        var deleteNode = function deleteNode(node) {
            if (!node) {
                return;
            }
            if (!node.parentNode) {
                // if there's no parent, there's nothing to do
                return;
            }
            if (!isIE() || (isIE() && isIE9Plus())) {
                // nothing special required
                node.parentNode.removeChild(node);
                return;
            }
            // The rest of this code is specialcasing for IE
            if (node.nodeName.toLowerCase() === "body") {
                // special case for removing body under IE.
                deleteChildren(node);
                try {
                    node.outerHTML = '';
                } catch (ex) {
                    // fails under some circumstances, but not in RI
                    // supplied responses.  If we've gotten here, it's
                    // fairly safe to leave a lingering body tag rather than
                    // fail outright
                }
                return;
            }
            var temp = node.ownerDocument.createElement('div');
            var parent = node.parentNode;
            temp.appendChild(parent.removeChild(node));
            // Now clean up the temporary element
            try {
                temp.outerHTML = ''; //prevent leak in IE
            } catch (ex) {
                // at least we tried.  Fails in some circumstances,
                // but not in RI supplied responses.  Better to leave a lingering
                // temporary div than to fail outright.
            }
        };

        /**
         * Deletes all children of a node
         * @param node
         * @ignore
         */
        var deleteChildren = function deleteChildren(node) {
            if (!node) {
                return;
            }
            for (var x = node.childNodes.length - 1; x >= 0; x--) { //delete all of node's children
                var childNode = node.childNodes[x];
                deleteNode(childNode);
            }
        };

        /**
         * <p> Copies the childNodes of nodeFrom to nodeTo</p>
         *
         * @param  nodeFrom the Node to copy the childNodes from
         * @param  nodeTo the Node to copy the childNodes to
         * @ignore
         * Note:  This code originally from Sarissa:  http://dev.abiss.gr/sarissa
         * It has been modified to fit into the overall codebase
         */
        var copyChildNodes = function copyChildNodes(nodeFrom, nodeTo) {

            if ((!nodeFrom) || (!nodeTo)) {
                throw "Both source and destination nodes must be provided";
            }

            deleteChildren(nodeTo);
            var nodes = nodeFrom.childNodes;
            // if within the same doc, just move, else copy and delete
            if (nodeFrom.ownerDocument == nodeTo.ownerDocument) {
                while (nodeFrom.firstChild) {
                    nodeTo.appendChild(nodeFrom.firstChild);
                }
            } else {
                var ownerDoc = nodeTo.nodeType == Node.DOCUMENT_NODE ? nodeTo : nodeTo.ownerDocument;
                var i;
                if (typeof(ownerDoc.importNode) != "undefined") {
                    for (i = 0; i < nodes.length; i++) {
                        nodeTo.appendChild(ownerDoc.importNode(nodes[i], true));
                    }
                } else {
                    for (i = 0; i < nodes.length; i++) {
                        nodeTo.appendChild(nodes[i].cloneNode(true));
                    }
                }
            }
        };


        /**
         * Replace one node with another.  Necessary for handling IE memory leak.
         * @param node
         * @param newNode
         * @ignore
         */
        var replaceNode = function replaceNode(newNode, node) {
            if (isIE()) {
                node.parentNode.insertBefore(newNode, node);
                deleteNode(node);
            } else {
                node.parentNode.replaceChild(newNode, node);
            }
        };

        /**
         * @ignore
         */
        var propertyToAttribute = function propertyToAttribute(name) {
            if (name === 'className') {
                return 'class';
            } else if (name === 'xmllang') {
                return 'xml:lang';
            } else {
                return name.toLowerCase();
            }
        };

        /**
         * @ignore
         */
        var isFunctionNative = function isFunctionNative(func) {
            return /^\s*function[^{]+{\s*\[native code\]\s*}\s*$/.test(String(func));
        };

        /**
         * @ignore
         */
        var detectAttributes = function detectAttributes(element) {
            //test if 'hasAttribute' method is present and its native code is intact
            //for example, Prototype can add its own implementation if missing
            if (element.hasAttribute && isFunctionNative(element.hasAttribute)) {
                return function (name) {
                    return element.hasAttribute(name);
                }
            } else {
                try {
                    //when accessing .getAttribute method without arguments does not throw an error then the method is not available
                    element.getAttribute;

                    var html = element.outerHTML;
                    var startTag = html.match(/^<[^>]*>/)[0];
                    return function (name) {
                        return startTag.indexOf(name + '=') > -1;
                    }
                } catch (ex) {
                    return function (name) {
                        return element.getAttribute(name);
                    }
                }
            }
        };

        /**
         * copy all attributes from one element to another - except id
         * @param target element to copy attributes to
         * @param source element to copy attributes from
         * @ignore
         */
        var cloneAttributes = function cloneAttributes(target, source) {

            // enumerate core element attributes - without 'dir' as special case
            var coreElementProperties = ['className', 'title', 'lang', 'xmllang'];
            // enumerate additional input element attributes
            var inputElementProperties = [
                'name', 'value', 'size', 'maxLength', 'src', 'alt', 'useMap', 'tabIndex', 'accessKey', 'accept', 'type'
            ];
            // enumerate additional boolean input attributes
            var inputElementBooleanProperties = [
                'checked', 'disabled', 'readOnly'
            ];

            // Enumerate all the names of the event listeners
            var listenerNames =
                [ 'onclick', 'ondblclick', 'onmousedown', 'onmousemove', 'onmouseout',
                    'onmouseover', 'onmouseup', 'onkeydown', 'onkeypress', 'onkeyup',
                    'onhelp', 'onblur', 'onfocus', 'onchange', 'onload', 'onunload', 'onabort',
                    'onreset', 'onselect', 'onsubmit'
                ];

            var sourceAttributeDetector = detectAttributes(source);
            var targetAttributeDetector = detectAttributes(target);

            var isInputElement = target.nodeName.toLowerCase() === 'input';
            var propertyNames = isInputElement ? coreElementProperties.concat(inputElementProperties) : coreElementProperties;
            var isXML = !source.ownerDocument.contentType || source.ownerDocument.contentType == 'text/xml';
            for (var iIndex = 0, iLength = propertyNames.length; iIndex < iLength; iIndex++) {
                var propertyName = propertyNames[iIndex];
                var attributeName = propertyToAttribute(propertyName);
                if (sourceAttributeDetector(attributeName)) {

                    //With IE 7 (quirks or standard mode) and IE 8/9 (quirks mode only), 
                    //you cannot get the attribute using 'class'. You must use 'className'
                    //which is the same value you use to get the indexed property. The only 
                    //reliable way to detect this (without trying to evaluate the browser
                    //mode and version) is to compare the two return values using 'className' 
                    //to see if they exactly the same.  If they are, then use the property
                    //name when using getAttribute.
                    if (attributeName == 'class') {
                        if (isIE() && (source.getAttribute(propertyName) === source[propertyName])) {
                            attributeName = propertyName;
                        }
                    }

                    var newValue = isXML ? source.getAttribute(attributeName) : source[propertyName];
                    var oldValue = target[propertyName];
                    if (oldValue != newValue) {
                        target[propertyName] = newValue;
                    }
                } else {
                    //setting property to '' seems to be the only cross-browser method for removing an attribute
                    //avoid setting 'value' property to '' for checkbox and radio input elements because then the
                    //'value' is used instead of the 'checked' property when the form is serialized by the browser
                    if (attributeName == "value" && (target.type != 'checkbox' && target.type != 'radio')) {
                        target[propertyName] = '';
                    }
                    target.removeAttribute(attributeName);
                }
            }

            var booleanPropertyNames = isInputElement ? inputElementBooleanProperties : [];
            for (var jIndex = 0, jLength = booleanPropertyNames.length; jIndex < jLength; jIndex++) {
                var booleanPropertyName = booleanPropertyNames[jIndex];
                var newBooleanValue = source[booleanPropertyName];
                var oldBooleanValue = target[booleanPropertyName];
                if (oldBooleanValue != newBooleanValue) {
                    target[booleanPropertyName] = newBooleanValue;
                }
            }

            //'style' attribute special case
            if (sourceAttributeDetector('style')) {
                var newStyle;
                var oldStyle;
                if (isIE()) {
                    newStyle = source.style.cssText;
                    oldStyle = target.style.cssText;
                    if (newStyle != oldStyle) {
                        target.style.cssText = newStyle;
                    }
                } else {
                    newStyle = source.getAttribute('style');
                    oldStyle = target.getAttribute('style');
                    if (newStyle != oldStyle) {
                        target.setAttribute('style', newStyle);
                    }
                }
            } else if (targetAttributeDetector('style')) {
                target.removeAttribute('style');
            }

            // Special case for 'dir' attribute
            if (!isIE() && source.dir != target.dir) {
                if (sourceAttributeDetector('dir')) {
                    target.dir = source.dir;
                } else if (targetAttributeDetector('dir')) {
                    target.dir = '';
                }
            }

            for (var lIndex = 0, lLength = listenerNames.length; lIndex < lLength; lIndex++) {
                var name = listenerNames[lIndex];
                target[name] = source[name] ? source[name] : null;
                if (source[name]) {
                    source[name] = null;
                }
            }

            //clone HTML5 data-* attributes
            try {
                var targetDataset = target.dataset;
                var sourceDataset = source.dataset;
                if (targetDataset || sourceDataset) {
                    //cleanup the dataset
                    for (var tp in targetDataset) {
                        delete targetDataset[tp];
                    }
                    //copy dataset's properties
                    for (var sp in sourceDataset) {
                        targetDataset[sp] = sourceDataset[sp];
                    }
                }
            } catch (ex) {
                //most probably dataset properties are not supported
            }
        };

        /**
         * Replace an element from one document into another
         * @param newElement new element to put in document
         * @param origElement original element to replace
         * @ignore
         */
        var elementReplace = function elementReplace(newElement, origElement) {
            copyChildNodes(newElement, origElement);
            // sadly, we have to reparse all over again
            // to reregister the event handlers and styles
            // PENDING do some performance tests on large pages
            origElement.innerHTML = origElement.innerHTML;

            try {
                cloneAttributes(origElement, newElement);
            } catch (ex) {
                // if in dev mode, report an error, else try to limp onward
                if (jsf.getProjectStage() == "Development") {
                    throw new Error("Error updating attributes");
                }
            }
            deleteNode(newElement);

        };

        /**
         * Create a new document, then select the body element within it
         * @param docStr Stringified version of document to create
         * @return element the body element
         * @ignore
         */
        var getBodyElement = function getBodyElement(docStr) {

            var doc;  // intermediate document we'll create
            var body; // Body element to return

            if (typeof DOMParser !== "undefined") {  // FF, S, Chrome
                doc = (new DOMParser()).parseFromString(docStr, "text/xml");
            } else if (typeof ActiveXObject !== "undefined") { // IE
                doc = new ActiveXObject("MSXML2.DOMDocument");
                doc.loadXML(docStr);
            } else {
                throw new Error("You don't seem to be running a supported browser");
            }

            if (getParseErrorText(doc) !== PARSED_OK) {
                throw new Error(getParseErrorText(doc));
            }

            body = doc.getElementsByTagName("body")[0];

            if (!body) {
                throw new Error("Can't find body tag in returned document.");
            }

            return body;
        };

        /**
         * Find encoded url field for a given form.
         * @param form
         * @ignore
         */
        var getEncodedUrlElement = function getEncodedUrlElement(form) {
            var encodedUrlElement = form['javax.faces.encodedURL'];

            if (encodedUrlElement) {
                return encodedUrlElement;
            } else {
                var formElements = form.elements;
                for (var i = 0, length = formElements.length; i < length; i++) {
                    var formElement = formElements[i];
                    if (formElement.name && (formElement.name.indexOf('javax.faces.encodedURL') >= 0)) {
                        return formElement;
                    }
                }
            }

            return undefined;
        };

        /**
         * Find view state field for a given form.
         * @param form
         * @ignore
         */
        var getViewStateElement = function getViewStateElement(form) {
            var viewStateElement = form['javax.faces.ViewState'];

            if (viewStateElement) {
                return viewStateElement;
            } else {
                var formElements = form.elements;
                for (var i = 0, length = formElements.length; i < length; i++) {
                    var formElement = formElements[i];
                    if (formElement.name && (formElement.name.indexOf('javax.faces.ViewState') >= 0)) {
                        return formElement;
                    }
                }
            }

            return undefined;
        };

        /**
         * Do update.
         * @param element element to update
         * @param context context of request
         * @ignore
         */
        var doUpdate = function doUpdate(element, context, partialResponseId) {
            var id, content, markup, state, windowId;
            var stateForm, windowIdForm;
            var scripts = []; // temp holding value for array of script nodes

            id = element.getAttribute('id');
            var viewStateRegex = new RegExp("javax.faces.ViewState" +
                jsf.separatorchar + ".*$");
            var windowIdRegex = new RegExp("^.*" + jsf.separatorchar +
                "javax.faces.ClientWindow" +
                jsf.separatorchar + ".*$");
            if (id.match(viewStateRegex)) {

                state = element.firstChild;

                // Now set the view state from the server into the DOM
                // but only for the form that submitted the request.

                if (typeof context.formid !== 'undefined' && context.formid !== null) {
                    stateForm = getFormForId(context.formid);
                } else {
                    stateForm = getFormForId(context.element.id);
                }

                if (!stateForm || !stateForm.elements) {
                    // if the form went away for some reason, or it lacks elements 
                    // we're going to just return silently.
                    return;
                }
                var field = getViewStateElement(stateForm);
                if (typeof field == 'undefined') {
                    field = document.createElement("input");
                    field.type = "hidden";
                    field.name = "javax.faces.ViewState";
                    stateForm.appendChild(field);
                }
                if (typeof state.wholeText !== 'undefined') {
                    field.value = state.wholeText;
                } else {
                    field.value = state.nodeValue;
                }

                // Now set the view state from the server into the DOM
                // for any form that is a render target.

                if (typeof context.render !== 'undefined' && context.render !== null) {
                    var temp = context.render.split(' ');
                    for (var i = 0; i < temp.length; i++) {
                        if (temp.hasOwnProperty(i)) {
                            // See if the element is a form and
                            // the form is not the one that caused the submission..
                            var f = document.forms[temp[i]];
                            if (typeof f !== 'undefined' && f !== null && f.id !== context.formid) {
                                field = getViewStateElement(f);
                                if (typeof field === 'undefined') {
                                    field = document.createElement("input");
                                    field.type = "hidden";
                                    field.name = "javax.faces.ViewState";
                                    f.appendChild(field);
                                }
                                if (typeof state.wholeText !== 'undefined') {
                                    field.value = state.wholeText;
                                } else {
                                    field.value = state.nodeValue;
                                }
                            }
                        }
                    }
                }
                return;
            } else if (id.match(windowIdRegex)) {

                windowId = element.firstChild;

                // Now set the windowId from the server into the DOM
                // but only for the form that submitted the request.

                windowIdForm = document.getElementById(context.formid);
                if (!windowIdForm || !windowIdForm.elements) {
                    // if the form went away for some reason, or it lacks elements 
                    // we're going to just return silently.
                    return;
                }
                var field = windowIdForm.elements["javax.faces.ClientWindow"];
                if (typeof field == 'undefined') {
                    field = document.createElement("input");
                    field.type = "hidden";
                    field.name = "javax.faces.ClientWindow";
                    windowIdForm.appendChild(field);
                }
                field.value = windowId.nodeValue;

                // Now set the windowId from the server into the DOM
                // for any form that is a render target.

                if (typeof context.render !== 'undefined' && context.render !== null) {
                    var temp = context.render.split(' ');
                    for (var i = 0; i < temp.length; i++) {
                        if (temp.hasOwnProperty(i)) {
                            // See if the element is a form and
                            // the form is not the one that caused the submission..
                            var f = document.forms[temp[i]];
                            if (typeof f !== 'undefined' && f !== null && f.id !== context.formid) {
                                field = f.elements["javax.faces.ClientWindow"];
                                if (typeof field === 'undefined') {
                                    field = document.createElement("input");
                                    field.type = "hidden";
                                    field.name = "javax.faces.ClientWindow";
                                    f.appendChild(field);
                                }
                                field.value = windowId.nodeValue;
                            }
                        }
                    }
                }
                return;
            }

            // join the CDATA sections in the markup
            markup = '';
            for (var j = 0; j < element.childNodes.length; j++) {
                content = element.childNodes[j];
                markup += content.nodeValue;
            }

            var src = markup;

            // If our special render all markup is present..
            if (id === "javax.faces.ViewRoot" || id === "javax.faces.ViewBody") {
                var bodyStartEx = new RegExp("< *body[^>]*>", "gi");
                var bodyEndEx = new RegExp("< */ *body[^>]*>", "gi");
                var newsrc;

                var docBody = document.getElementsByTagName("body")[0];
                var bodyStart = bodyStartEx.exec(src);

                if (bodyStart !== null) { // replace body tag
                    // First, try with XML manipulation
                    try {
                        // Get scripts from text
                        scripts = stripScripts(src);
                        // Remove scripts from text
                        newsrc = src.replace(/<script[^>]*type="text\/javascript"*>([\S\s]*?)<\/script>/igm, "");
                        elementReplace(getBodyElement(newsrc), docBody);
                        runScripts(scripts);
                    } catch (e) {
                        // OK, replacing the body didn't work with XML - fall back to quirks mode insert
                        var srcBody, bodyEnd;
                        // if src contains </body>
                        bodyEnd = bodyEndEx.exec(src);
                        if (bodyEnd !== null) {
                            srcBody = src.substring(bodyStartEx.lastIndex,
                                bodyEnd.index);
                        } else { // can't find the </body> tag, punt
                            srcBody = src.substring(bodyStartEx.lastIndex);
                        }
                        // replace body contents with innerHTML - note, script handling happens within function
                        elementReplaceStr(docBody, "body", srcBody);

                    }

                } else {  // replace body contents with innerHTML - note, script handling happens within function
                    elementReplaceStr(docBody, "body", src);
                }
            } else if (id === "javax.faces.ViewHead") {
                throw new Error("javax.faces.ViewHead not supported - browsers cannot reliably replace the head's contents");
            } else {
                var d = $(id);
                if (!d) {
                    throw new Error("During update: " + id + " not found");
                }
                var parent = d.parentNode;
                // Trim space padding before assigning to innerHTML
                var html = src.replace(/^\s+/g, '').replace(/\s+$/g, '');
                var parserElement = document.createElement('div');
                var tag = d.nodeName.toLowerCase();
                var tableElements = ['td', 'th', 'tr', 'tbody', 'thead', 'tfoot'];
                var isInTable = false;
                for (var tei = 0, tel = tableElements.length; tei < tel; tei++) {
                    if (tableElements[tei] == tag) {
                        isInTable = true;
                        break;
                    }
                }
                if (isInTable) {

                    if (isAutoExec()) {
                        // Create html
                        parserElement.innerHTML = '<table>' + html + '</table>';
                    } else {
                        // Get the scripts from the text
                        scripts = stripScripts(html);
                        // Remove scripts from text
                        html = html.replace(/<script[^>]*type="text\/javascript"*>([\S\s]*?)<\/script>/igm, "");
                        parserElement.innerHTML = '<table>' + html + '</table>';
                    }
                    var newElement = parserElement.firstChild;
                    //some browsers will also create intermediary elements such as table>tbody>tr>td
                    while ((null !== newElement) && (id !== newElement.id)) {
                        newElement = newElement.firstChild;
                    }
                    parent.replaceChild(newElement, d);
                    runScripts(scripts);
                } else if (d.nodeName.toLowerCase() === 'input') {
                    // special case handling for 'input' elements
                    // in order to not lose focus when updating,
                    // input elements need to be added in place.
                    parserElement = document.createElement('div');
                    parserElement.innerHTML = html;
                    newElement = parserElement.firstChild;

                    cloneAttributes(d, newElement);
                    deleteNode(parserElement);
                } else if (html.length > 0) {
                    if (isAutoExec()) {
                        // Create html
                        parserElement.innerHTML = html;
                    } else {
                        // Get the scripts from the text
                        scripts = stripScripts(html);
                        // Remove scripts from text
                        html = html.replace(/<script[^>]*type="text\/javascript"*>([\S\s]*?)<\/script>/igm, "");
                        parserElement.innerHTML = html;
                    }
                    replaceNode(parserElement.firstChild, d);
                    deleteNode(parserElement);
                    runScripts(scripts);
                }
            }
        };

        /**
         * Delete a node specified by the element.
         * @param element
         * @ignore
         */
        var doDelete = function doDelete(element) {
            var id = element.getAttribute('id');
            var target = $(id);
            deleteNode(target);
        };

        /**
         * Insert a node specified by the element.
         * @param element
         * @ignore
         */
        var doInsert = function doInsert(element) {
            var tablePattern = new RegExp("<\\s*(td|th|tr|tbody|thead|tfoot)", "i");
            var scripts = [];
            var target = $(element.firstChild.getAttribute('id'));
            var parent = target.parentNode;
            var html = element.firstChild.firstChild.nodeValue;
            var isInTable = tablePattern.test(html);

            if (!isAutoExec()) {
                // Get the scripts from the text
                scripts = stripScripts(html);
                // Remove scripts from text
                html = html.replace(/<script[^>]*type="text\/javascript"*>([\S\s]*?)<\/script>/igm, "");
            }
            var tempElement = document.createElement('div');
            var newElement = null;
            if (isInTable) {
                tempElement.innerHTML = '<table>' + html + '</table>';
                newElement = tempElement.firstChild;
                //some browsers will also create intermediary elements such as table>tbody>tr>td
                //test for presence of id on the new element since we do not have it directly
                while ((null !== newElement) && ("" == newElement.id)) {
                    newElement = newElement.firstChild;
                }
            } else {
                tempElement.innerHTML = html;
                newElement = tempElement.firstChild;
            }

            if (element.firstChild.nodeName === 'after') {
                // Get the next in the list, to insert before
                target = target.nextSibling;
            }  // otherwise, this is a 'before' element
            if (!!tempElement.innerHTML) { // check if only scripts were inserted - if so, do nothing here
                parent.insertBefore(newElement, target);
            }
            runScripts(scripts);
            deleteNode(tempElement);
        };

        /**
         * Modify attributes of given element id.
         * @param element
         * @ignore
         */
        var doAttributes = function doAttributes(element) {

            // Get id of element we'll act against
            var id = element.getAttribute('id');

            var target = $(id);

            if (!target) {
                throw new Error("The specified id: " + id + " was not found in the page.");
            }

            // There can be multiple attributes modified.  Loop through the list.
            var nodes = element.childNodes;
            for (var i = 0; i < nodes.length; i++) {
                var name = nodes[i].getAttribute('name');
                var value = nodes[i].getAttribute('value');

                //boolean attribute handling code for all browsers
                if (name === 'disabled') {
                    target.disabled = value === 'disabled' || value === 'true';
                    return;
                } else if (name === 'checked') {
                    target.checked = value === 'checked' || value === 'on' || value === 'true';
                    return;
                } else if (name == 'readonly') {
                    target.readOnly = value === 'readonly' || value === 'true';
                    return;
                }

                if (!isIE()) {
                    if (name === 'value') {
                        target.value = value;
                    } else {
                        target.setAttribute(name, value);
                    }
                } else { // if it's IE, then quite a bit more work is required
                    if (name === 'class') {
                        target.className = value;
                    } else if (name === "for") {
                        name = 'htmlFor';
                        target.setAttribute(name, value, 0);
                    } else if (name === 'style') {
                        target.style.setAttribute('cssText', value, 0);
                    } else if (name.substring(0, 2) === 'on') {
                        var c = document.body.appendChild(document.createElement('span'));
                        try {
                            c.innerHTML = '<span ' + name + '="' + value + '"/>';
                            target[name] = c.firstChild[name];
                        } finally {
                            document.body.removeChild(c);
                        }
                    } else if (name === 'dir') {
                        if (jsf.getProjectStage() == 'Development') {
                            throw new Error("Cannot set 'dir' attribute in IE");
                        }
                    } else {
                        target.setAttribute(name, value, 0);
                    }
                }
            }
        };

        /**
         * Eval the CDATA of the element.
         * @param element to eval
         * @ignore
         */
        var doEval = function doEval(element) {
            var evalText = element.firstChild.nodeValue;
            globalEval(evalText);
        };

        /**
         * Ajax Request Queue
         * @ignore
         */
        var Queue = new function Queue() {

            // Create the internal queue
            var queue = [];


            // the amount of space at the front of the queue, initialised to zero
            var queueSpace = 0;

            /** Returns the size of this Queue. The size of a Queue is equal to the number
             * of elements that have been enqueued minus the number of elements that have
             * been dequeued.
             * @ignore
             */
            this.getSize = function getSize() {
                return queue.length - queueSpace;
            };

            /** Returns true if this Queue is empty, and false otherwise. A Queue is empty
             * if the number of elements that have been enqueued equals the number of
             * elements that have been dequeued.
             * @ignore
             */
            this.isEmpty = function isEmpty() {
                return (queue.length === 0);
            };

            /** Enqueues the specified element in this Queue.
             *
             * @param element - the element to enqueue
             * @ignore
             */
            this.enqueue = function enqueue(element) {
                // Queue the request
                queue.push(element);
            };


            /** Dequeues an element from this Queue. The oldest element in this Queue is
             * removed and returned. If this Queue is empty then undefined is returned.
             *
             * @returns Object The element that was removed from the queue.
             * @ignore
             */
            this.dequeue = function dequeue() {
                // initialise the element to return to be undefined
                var element = undefined;

                // check whether the queue is empty
                if (queue.length) {
                    // fetch the oldest element in the queue
                    element = queue[queueSpace];

                    // update the amount of space and check whether a shift should occur
                    if (++queueSpace * 2 >= queue.length) {
                        // set the queue equal to the non-empty portion of the queue
                        queue = queue.slice(queueSpace);
                        // reset the amount of space at the front of the queue
                        queueSpace = 0;
                    }
                }
                // return the removed element
                try {
                    return element;
                } finally {
                    element = null; // IE 6 leak prevention
                }
            };

            /** Returns the oldest element in this Queue. If this Queue is empty then
             * undefined is returned. This function returns the same value as the dequeue
             * function, but does not remove the returned element from this Queue.
             * @ignore
             */
            this.getOldestElement = function getOldestElement() {
                // initialise the element to return to be undefined
                var element = undefined;

                // if the queue is not element then fetch the oldest element in the queue
                if (queue.length) {
                    element = queue[queueSpace];
                }
                // return the oldest element
                try {
                    return element;
                } finally {
                    element = null; //IE 6 leak prevention
                }
            };
        }();


        /**
         * AjaxEngine handles Ajax implementation details.
         * @ignore
         */
        var AjaxEngine = function AjaxEngine(context) {

            var req = {};                  // Request Object
            req.url = null;                // Request URL
            req.context = context;              // Context of request and response
            req.context.sourceid = null;   // Source of this request
            req.context.onerror = null;    // Error handler for request
            req.context.onevent = null;    // Event handler for request
            req.xmlReq = null;             // XMLHttpRequest Object
            req.async = true;              // Default - Asynchronous
            req.parameters = {};           // Parameters For GET or POST
            req.queryString = null;        // Encoded Data For GET or POST
            req.method = null;             // GET or POST
            req.status = null;             // Response Status Code From Server
            req.fromQueue = false;         // Indicates if the request was taken off the queue
            // before being sent.  This prevents the request from
            // entering the queue redundantly.

            req.que = Queue;

            // Get a transport Handle
            // The transport will be an iframe transport if the form
            // has multipart encoding type.  This is where we could
            // handle XMLHttpRequest Level2 as well (perhaps 
            // something like:  if ('upload' in req.xmlReq)'
            req.xmlReq = getTransport(context);

            if (req.xmlReq === null) {
                return null;
            }

            /**
             * @ignore
             */
            function noop() {
            }

            // Set up request/response state callbacks
            /**
             * @ignore
             */
            req.xmlReq.onreadystatechange = function () {
                if (req.xmlReq.readyState === 4) {
                    req.onComplete();
                    // next two lines prevent closure/ciruclar reference leaks
                    // of XHR instances in IE
                    req.xmlReq.onreadystatechange = noop;
                    req.xmlReq = null;
                }
            };

            /**
             * This function is called when the request/response interaction
             * is complete.  If the return status code is successfull,
             * dequeue all requests from the queue that have completed.  If a
             * request has been found on the queue that has not been sent,
             * send the request.
             * @ignore
             */
            req.onComplete = function onComplete() {
                if (req.xmlReq.status && (req.xmlReq.status >= 200 && req.xmlReq.status < 300)) {
                    sendEvent(req.xmlReq, req.context, "complete");
                    jsf.ajax.response(req.xmlReq, req.context);
                } else {
                    sendEvent(req.xmlReq, req.context, "complete");
                    sendError(req.xmlReq, req.context, "httpError");
                }

                // Regardless of whether the request completed successfully (or not),
                // dequeue requests that have been completed (readyState 4) and send
                // requests that ready to be sent (readyState 0).

                var nextReq = req.que.getOldestElement();
                if (nextReq === null || typeof nextReq === 'undefined') {
                    return;
                }
                while ((typeof nextReq.xmlReq !== 'undefined' && nextReq.xmlReq !== null) &&
                    nextReq.xmlReq.readyState === 4) {
                    req.que.dequeue();
                    nextReq = req.que.getOldestElement();
                    if (nextReq === null || typeof nextReq === 'undefined') {
                        break;
                    }
                }
                if (nextReq === null || typeof nextReq === 'undefined') {
                    return;
                }
                if ((typeof nextReq.xmlReq !== 'undefined' && nextReq.xmlReq !== null) &&
                    nextReq.xmlReq.readyState === 0) {
                    nextReq.fromQueue = true;
                    nextReq.sendRequest();
                }
            };

            /**
             * Utility method that accepts additional arguments for the AjaxEngine.
             * If an argument is passed in that matches an AjaxEngine property, the
             * argument value becomes the value of the AjaxEngine property.
             * Arguments that don't match AjaxEngine properties are added as
             * request parameters.
             * @ignore
             */
            req.setupArguments = function (args) {
                for (var i in args) {
                    if (args.hasOwnProperty(i)) {
                        if (typeof req[i] === 'undefined') {
                            req.parameters[i] = args[i];
                        } else {
                            req[i] = args[i];
                        }
                    }
                }
            };

            /**
             * This function does final encoding of parameters, determines the request method
             * (GET or POST) and sends the request using the specified url.
             * @ignore
             */
            req.sendRequest = function () {
                if (req.xmlReq !== null) {
                    // if there is already a request on the queue waiting to be processed..
                    // just queue this request
                    if (!req.que.isEmpty()) {
                        if (!req.fromQueue) {
                            req.que.enqueue(req);
                            return;
                        }
                    }
                    // If the queue is empty, queue up this request and send
                    if (!req.fromQueue) {
                        req.que.enqueue(req);
                    }
                    // Some logic to get the real request URL
                    if (req.generateUniqueUrl && req.method == "GET") {
                        req.parameters["AjaxRequestUniqueId"] = new Date().getTime() + "" + req.requestIndex;
                    }
                    var content = null; // For POST requests, to hold query string
                    for (var i in req.parameters) {
                        if (req.parameters.hasOwnProperty(i)) {
                            if (req.queryString.length > 0) {
                                req.queryString += "&";
                            }
                            req.queryString += encodeURIComponent(i) + "=" + encodeURIComponent(req.parameters[i]);
                        }
                    }
                    if (req.method === "GET") {
                        if (req.queryString.length > 0) {
                            req.url += ((req.url.indexOf("?") > -1) ? "&" : "?") + req.queryString;
                        }
                    }
                    req.xmlReq.open(req.method, req.url, req.async);
                    // note that we are including the charset=UTF-8 as part of the content type (even
                    // if encodeURIComponent encodes as UTF-8), because with some
                    // browsers it will not be set in the request.  Some server implementations need to 
                    // determine the character encoding from the request header content type.
                    if (req.method === "POST") {
                        if (typeof req.xmlReq.setRequestHeader !== 'undefined') {
                            req.xmlReq.setRequestHeader('Faces-Request', 'partial/ajax');
                            req.xmlReq.setRequestHeader('Content-type', 'application/x-www-form-urlencoded;charset=UTF-8');
                        }
                        content = req.queryString;
                    }
                    // note that async == false is not a supported feature.  We may change it in ways
                    // that break existing programs at any time, with no warning.
                    if (!req.async) {
                        req.xmlReq.onreadystatechange = null; // no need for readystate change listening
                    }
                    sendEvent(req.xmlReq, req.context, "begin");
                    req.xmlReq.send(content);
                    if (!req.async) {
                        req.onComplete();
                    }
                }
            };

            return req;
        };

        /**
         * Error handling callback.
         * Assumes that the request has completed.
         * @ignore
         */
        var sendError = function sendError(request, context, status, description, serverErrorName, serverErrorMessage) {

            // Possible errornames:
            // httpError
            // emptyResponse
            // serverError
            // malformedXML

            var sent = false;
            var data = {};  // data payload for function
            data.type = "error";
            data.status = status;
            data.source = context.sourceid;
            data.responseCode = request.status;
            data.responseXML = request.responseXML;
            data.responseText = request.responseText;

            // ensure data source is the dom element and not the ID
            // per 14.4.1 of the 2.0 specification.
            if (typeof data.source === 'string') {
                data.source = document.getElementById(data.source);
            }

            if (description) {
                data.description = description;
            } else if (status == "httpError") {
                if (data.responseCode === 0) {
                    data.description = "The Http Transport returned a 0 status code.  This is usually the result of mixing ajax and full requests.  This is usually undesired, for both performance and data integrity reasons.";
                } else {
                    data.description = "There was an error communicating with the server, status: " + data.responseCode;
                }
            } else if (status == "serverError") {
                data.description = serverErrorMessage;
            } else if (status == "emptyResponse") {
                data.description = "An empty response was received from the server.  Check server error logs.";
            } else if (status == "malformedXML") {
                if (getParseErrorText(data.responseXML) !== PARSED_OK) {
                    data.description = getParseErrorText(data.responseXML);
                } else {
                    data.description = "An invalid XML response was received from the server.";
                }
            }

            if (status == "serverError") {
                data.errorName = serverErrorName;
                data.errorMessage = serverErrorMessage;
            }

            // If we have a registered callback, send the error to it.
            if (context.onerror) {
                context.onerror.call(null, data);
                sent = true;
            }

            for (var i in errorListeners) {
                if (errorListeners.hasOwnProperty(i)) {
                    errorListeners[i].call(null, data);
                    sent = true;
                }
            }

            if (!sent && jsf.getProjectStage() === "Development") {
                if (status == "serverError") {
                    alert("serverError: " + serverErrorName + " " + serverErrorMessage);
                } else {
                    alert(status + ": " + data.description);
                }
            }
        };

        /**
         * Event handling callback.
         * Request is assumed to have completed, except in the case of event = 'begin'.
         * @ignore
         */
        var sendEvent = function sendEvent(request, context, status) {

            var data = {};
            data.type = "event";
            data.status = status;
            data.source = context.sourceid;
            // ensure data source is the dom element and not the ID
            // per 14.4.1 of the 2.0 specification.
            if (typeof data.source === 'string') {
                data.source = document.getElementById(data.source);
            }
            if (status !== 'begin') {
                data.responseCode = request.status;
                data.responseXML = request.responseXML;
                data.responseText = request.responseText;
            }

            if (context.onevent) {
                context.onevent.call(null, data);
            }

            for (var i in eventListeners) {
                if (eventListeners.hasOwnProperty(i)) {
                    eventListeners[i].call(null, data);
                }
            }
        };

        // Use module pattern to return the functions we actually expose
        return {
            /**
             * Register a callback for error handling.
             * <p><b>Usage:</b></p>
             * <pre><code>
             * jsf.ajax.addOnError(handleError);
             * ...
             * var handleError = function handleError(data) {
             * ...
             * }
             * </pre></code>
             * <p><b>Implementation Requirements:</b></p>
             * This function must accept a reference to an existing JavaScript function.
             * The JavaScript function reference must be added to a list of callbacks, making it possible
             * to register more than one callback by invoking <code>jsf.ajax.addOnError</code>
             * more than once.  This function must throw an error if the <code>callback</code>
             * argument is not a function.
             *
             * @member jsf.ajax
             * @param callback a reference to a function to call on an error
             */
            addOnError: function addOnError(callback) {
                if (typeof callback === 'function') {
                    errorListeners[errorListeners.length] = callback;
                } else {
                    throw new Error("jsf.ajax.addOnError:  Added a callback that was not a function.");
                }
            },
            /**
             * Register a callback for event handling.
             * <p><b>Usage:</b></p>
             * <pre><code>
             * jsf.ajax.addOnEvent(statusUpdate);
             * ...
             * var statusUpdate = function statusUpdate(data) {
             * ...
             * }
             * </pre></code>
             * <p><b>Implementation Requirements:</b></p>
             * This function must accept a reference to an existing JavaScript function.
             * The JavaScript function reference must be added to a list of callbacks, making it possible
             * to register more than one callback by invoking <code>jsf.ajax.addOnEvent</code>
             * more than once.  This function must throw an error if the <code>callback</code>
             * argument is not a function.
             *
             * @member jsf.ajax
             * @param callback a reference to a function to call on an event
             */
            addOnEvent: function addOnEvent(callback) {
                if (typeof callback === 'function') {
                    eventListeners[eventListeners.length] = callback;
                } else {
                    throw new Error("jsf.ajax.addOnEvent: Added a callback that was not a function");
                }
            },


            request: function request(source, event, options) {
                var element, form;   //  Element variables
                var all, none;

                var context = {};

                if (typeof source === 'undefined' || source === null) {
                    throw new Error("jsf.ajax.request: source not set");
                }
                if (delayHandler) {
                    clearTimeout(delayHandler);
                    delayHandler = null;
                }

                // set up the element based on source
                if (typeof source === 'string') {
                    element = document.getElementById(source);
                } else if (typeof source === 'object') {
                    element = source;
                } else {
                    throw new Error("jsf.request: source must be object or string");
                }
                // attempt to handle case of name unset
                // this might be true in a badly written composite component
                if (!element.name) {
                    element.name = element.id;
                }

                context.element = element;

                if (typeof(options) === 'undefined' || options === null) {
                    options = {};
                }

                // Error handler for this request
                var onerror = false;

                if (options.onerror && typeof options.onerror === 'function') {
                    onerror = options.onerror;
                } else if (options.onerror && typeof options.onerror !== 'function') {
                    throw new Error("jsf.ajax.request: Added an onerror callback that was not a function");
                }

                // Event handler for this request
                var onevent = false;

                if (options.onevent && typeof options.onevent === 'function') {
                    onevent = options.onevent;
                } else if (options.onevent && typeof options.onevent !== 'function') {
                    throw new Error("jsf.ajax.request: Added an onevent callback that was not a function");
                }

                form = getForm(element);
                if (!form) {
                    throw new Error("jsf.ajax.request: Method must be called within a form");
                }
                context.form = form;
                context.formid = form.id;

                var viewState = jsf.getViewState(form);

                // Set up additional arguments to be used in the request..
                // Make sure "javax.faces.source" is set up.
                // If there were "execute" ids specified, make sure we
                // include the identifier of the source element in the
                // "execute" list.  If there were no "execute" ids
                // specified, determine the default.

                var args = {};

                var namingContainerId = options["com.sun.faces.namingContainerId"];

                if (typeof(namingContainerId) === 'undefined' || options === null) {
                    namingContainerId = "";
                }

                args[namingContainerId + "javax.faces.source"] = element.id;

                if (event && !!event.type) {
                    args[namingContainerId + "javax.faces.partial.event"] = event.type;
                }

                if ("resetValues" in options) {
                    args[namingContainerId + "javax.faces.partial.resetValues"] = options.resetValues;
                }

                // If we have 'execute' identifiers:
                // Handle any keywords that may be present.
                // If @none present anywhere, do not send the
                // "javax.faces.partial.execute" parameter.
                // The 'execute' and 'render' lists must be space
                // delimited.

                if (options.execute) {
                    none = options.execute.search(/@none/);
                    if (none < 0) {
                        all = options.execute.search(/@all/);
                        if (all < 0) {
                            options.execute = options.execute.replace("@this", element.id);
                            options.execute = options.execute.replace("@form", form.id);
                            var temp = options.execute.split(' ');
                            if (!isInArray(temp, element.name)) {
                                options.execute = element.name + " " + options.execute;
                            }
                        } else {
                            options.execute = "@all";
                        }
                        args[namingContainerId + "javax.faces.partial.execute"] = options.execute;
                    }
                } else {
                    options.execute = element.name + " " + element.id;
                    args[namingContainerId + "javax.faces.partial.execute"] = options.execute;
                }

                if (options.render) {
                    none = options.render.search(/@none/);
                    if (none < 0) {
                        all = options.render.search(/@all/);
                        if (all < 0) {
                            options.render = options.render.replace("@this", element.id);
                            options.render = options.render.replace("@form", form.id);
                        } else {
                            options.render = "@all";
                        }
                        args[namingContainerId + "javax.faces.partial.render"] = options.render;
                    }
                }
                var explicitlyDoNotDelay = ((typeof options.delay == 'undefined') || (typeof options.delay == 'string') &&
                    (options.delay.toLowerCase() == 'none'));
                var delayValue;
                if (typeof options.delay == 'number') {
                    delayValue = options.delay;
                } else {
                    var converted = parseInt(options.delay);

                    if (!explicitlyDoNotDelay && isNaN(converted)) {
                        throw new Error('invalid value for delay option: ' + options.delay);
                    }
                    delayValue = converted;
                }

                // remove non-passthrough options
                delete options.execute;
                delete options.render;
                delete options.onerror;
                delete options.onevent;
                delete options.delay;

                // copy all other options to args
                for (var property in options) {
                    if (options.hasOwnProperty(property)) {
                        if (property != "com.sun.faces.namingContainerId") {
                            args[namingContainerId + property] = options[property];
                        }
                    }
                }

                args[namingContainerId + "javax.faces.partial.ajax"] = "true";
                args["method"] = "POST";

                // Determine the posting url

                var encodedUrlField = getEncodedUrlElement(form);
                if (typeof encodedUrlField == 'undefined') {
                    args["url"] = form.action;
                } else {
                    args["url"] = encodedUrlField.value;
                }
                var sendRequest = function () {
                    var ajaxEngine = new AjaxEngine(context);
                    ajaxEngine.setupArguments(args);
                    ajaxEngine.queryString = viewState;
                    ajaxEngine.context.onevent = onevent;
                    ajaxEngine.context.onerror = onerror;
                    ajaxEngine.context.sourceid = element.id;
                    ajaxEngine.context.render = args[namingContainerId + "javax.faces.partial.render"];
                    ajaxEngine.sendRequest();

                    // null out element variables to protect against IE memory leak
                    element = null;
                    form = null;
                    sendRequest = null;
                    context = null;
                };

                if (explicitlyDoNotDelay) {
                    sendRequest();
                } else {
                    delayHandler = setTimeout(sendRequest, delayValue);
                }

            },

            response: function response(request, context) {
                if (!request) {
                    throw new Error("jsf.ajax.response: Request parameter is unset");
                }

                // ensure context source is the dom element and not the ID
                // per 14.4.1 of the 2.0 specification.  We're doing it here
                // *before* any errors or events are propagated becasue the
                // DOM element may be removed after the update has been processed.
                if (typeof context.sourceid === 'string') {
                    context.sourceid = document.getElementById(context.sourceid);
                }

                var xml = request.responseXML;
                if (xml === null) {
                    sendError(request, context, "emptyResponse");
                    return;
                }

                if (getParseErrorText(xml) !== PARSED_OK) {
                    sendError(request, context, "malformedXML");
                    return;
                }

                var partialResponse = xml.getElementsByTagName("partial-response")[0];
                var partialResponseId = partialResponse.getAttribute("id");
                var responseType = partialResponse.firstChild;

                for (var i = 0; i < partialResponse.childNodes.length; i++) {
                    if (partialResponse.childNodes[i].nodeName === "error") {
                        responseType = partialResponse.childNodes[i];
                        break;
                    }
                }

                if (responseType.nodeName === "error") { // it's an error
                    var errorName = "";
                    var errorMessage = "";

                    var element = responseType.firstChild;
                    if (element.nodeName === "error-name") {
                        if (null != element.firstChild) {
                            errorName = element.firstChild.nodeValue;
                        }
                    }

                    element = responseType.firstChild.nextSibling;
                    if (element.nodeName === "error-message") {
                        if (null != element.firstChild) {
                            errorMessage = element.firstChild.nodeValue;
                        }
                    }
                    sendError(request, context, "serverError", null, errorName, errorMessage);
                    sendEvent(request, context, "success");
                    return;
                }


                if (responseType.nodeName === "redirect") {
                    window.location = responseType.getAttribute("url");
                    return;
                }


                if (responseType.nodeName !== "changes") {
                    sendError(request, context, "malformedXML", "Top level node must be one of: changes, redirect, error, received: " + responseType.nodeName + " instead.");
                    return;
                }


                var changes = responseType.childNodes;

                try {
                    for (var i = 0; i < changes.length; i++) {
                        switch (changes[i].nodeName) {
                            case "update":
                                doUpdate(changes[i], context, partialResponseId);
                                break;
                            case "delete":
                                doDelete(changes[i]);
                                break;
                            case "insert":
                                doInsert(changes[i]);
                                break;
                            case "attributes":
                                doAttributes(changes[i]);
                                break;
                            case "eval":
                                doEval(changes[i]);
                                break;
                            case "extension":
                                // no action
                                break;
                            default:
                                sendError(request, context, "malformedXML", "Changes allowed are: update, delete, insert, attributes, eval, extension.  Received " + changes[i].nodeName + " instead.");
                                return;
                        }
                    }
                } catch (ex) {
                    sendError(request, context, "malformedXML", ex.message);
                    return;
                }
                sendEvent(request, context, "success");

            }
        };
    }();

    /**
     *
     * <p>Return the value of <code>Application.getProjectStage()</code> for
     * the currently running application instance.  Calling this method must
     * not cause any network transaction to happen to the server.</p>
     * <p><b>Usage:</b></p>
     * <pre><code>
     * var stage = jsf.getProjectStage();
     * if (stage === ProjectStage.Development) {
     *  ...
     * } else if stage === ProjectStage.Production) {
     *  ...
     * }
     * </code></pre>
     *
     * @returns String <code>String</code> representing the current state of the
     * running application in a typical product development lifecycle.  Refer
     * to <code>javax.faces.application.Application.getProjectStage</code> and
     * <code>javax.faces.application.ProjectStage</code>.
     * @function jsf.getProjectStage
     */
    jsf.getProjectStage = function () {
        // First, return cached value if available
        if (typeof mojarra !== 'undefined' && typeof mojarra.projectStageCache !== 'undefined') {
            return mojarra.projectStageCache;
        }
        var scripts = document.getElementsByTagName("script"); // nodelist of scripts
        var script; // jsf.js script
        var s = 0; // incremental variable for for loop
        var stage; // temp value for stage
        var match; // temp value for match
        while (s < scripts.length) {
            if (typeof scripts[s].src === 'string' && scripts[s].src.match('\/javax\.faces\.resource\/jsf\.js\?.*ln=javax\.faces')) {
                script = scripts[s].src;
                break;
            }
            s++;
        }
        if (typeof script == "string") {
            match = script.match("stage=(.*)");
            if (match) {
                stage = match[1];
            }
        }
        if (typeof stage === 'undefined' || !stage) {
            stage = "Production";
        }

        mojarra = mojarra || {};
        mojarra.projectStageCache = stage;

        return mojarra.projectStageCache;
    };



    jsf.getViewState = function (form) {
        if (!form) {
            throw new Error("jsf.getViewState:  form must be set");
        }
        var els = form.elements;
        var len = els.length;
        // create an array which we'll use to hold all the intermediate strings
        // this bypasses a problem in IE when repeatedly concatenating very
        // large strings - we'll perform the concatenation once at the end
        var qString = [];
        var addField = function (name, value) {
            var tmpStr = "";
            if (qString.length > 0) {
                tmpStr = "&";
            }
            tmpStr += encodeURIComponent(name) + "=" + encodeURIComponent(value);
            qString.push(tmpStr);
        };
        for (var i = 0; i < len; i++) {
            var el = els[i];
            if (el.name === "") {
                continue;
            }
            if (!el.disabled) {
                switch (el.type) {
                    case 'button':
                    case 'submit':
                    case 'reset':
                    case 'image':
                    case 'file':
                        break;
                    case 'select-one':
                        if (el.selectedIndex >= 0) {
                            addField(el.name, el.options[el.selectedIndex].value);
                        }
                        break;
                    case 'select-multiple':
                        for (var j = 0; j < el.options.length; j++) {
                            if (el.options[j].selected) {
                                addField(el.name, el.options[j].value);
                            }
                        }
                        break;
                    case 'checkbox':
                    case 'radio':
                        if (el.checked) {
                            addField(el.name, el.value || 'on');
                        }
                        break;
                    default:
                        // this is for any input incl.  text', 'password', 'hidden', 'textarea'
                        var nodeName = el.nodeName.toLowerCase();
                        if (nodeName === "input" || nodeName === "select" ||
                            nodeName === "object" || nodeName === "textarea") {
                            addField(el.name, el.value);
                        }
                        break;
                }
            }
        }
        // concatenate the array
        return qString.join("");
    };

    jsf.getClientWindow = function (node) {
        var FORM = "form";
        var WIN_ID = "javax.faces.ClientWindow";

        /**
         * Find javax.faces.ClientWindow field for a given form.
         * @param form
         * @ignore
         */
        var getWindowIdElement = function getWindowIdElement(form) {
            var windowIdElement = form['javax.faces.ClientWindow'];

            if (windowIdElement) {
                return windowIdElement;
            } else {
                var formElements = form.elements;
                for (var i = 0, length = formElements.length; i < length; i++) {
                    var formElement = formElements[i];
                    console.log('!@#$ formElement.name=' + formElement.name);
                    if (formElement.name.indexOf('javax.faces.ClientWindow') >= 0) {
                        return formElement;
                    }
                }
            }

            return undefined;
        };

        var fetchWindowIdFromForms = function (forms) {
            var result_idx = {};
            var result;
            var foundCnt = 0;
            for (var cnt = forms.length - 1; cnt >= 0; cnt--) {
                var UDEF = 'undefined';
                var currentForm = forms[cnt];
                var windowIdElement = getWindowIdElement(currentForm);
                var windowId = windowIdElement && windowIdElement.value;
                if (UDEF != typeof windowId) {
                    if (foundCnt > 0 && UDEF == typeof result_idx[windowId]) throw Error("Multiple different windowIds found in document");
                    result = windowId;
                    result_idx[windowId] = true;
                    foundCnt++;
                }
            }
            return result;
        }

        /**
         * @ignore
         */
        var getChildForms = function (currentElement) {
            //Special condition no element we return document forms
            //as search parameter, ideal would be to
            //have the viewroot here but the frameworks
            //can deal with that themselves by using
            //the viewroot as currentElement
            if (!currentElement) {
                return document.forms;
            }

            var targetArr = [];
            if (!currentElement.tagName) return [];
            else if (currentElement.tagName.toLowerCase() == FORM) {
                targetArr.push(currentElement);
                return targetArr;
            }

            //if query selectors are supported we can take
            //a non recursive shortcut
            if (currentElement.querySelectorAll) {
                return currentElement.querySelectorAll(FORM);
            }

            //old recursive way, due to flakeyness of querySelectorAll
            for (var cnt = currentElement.childNodes.length - 1; cnt >= 0; cnt--) {
                var currentChild = currentElement.childNodes[cnt];
                targetArr = targetArr.concat(getChildForms(currentChild, FORM));
            }
            return targetArr;
        }

        /**
         * @ignore
         */
        var fetchWindowIdFromURL = function () {
            var href = window.location.href;
            var windowId = "windowId";
            var regex = new RegExp("[\\?&]" + windowId + "=([^&#\\;]*)");
            var results = regex.exec(href);
            //initial trial over the url and a regexp
            if (results != null) return results[1];
            return null;
        }

        //byId ($)
        var finalNode = (node && (typeof node == "string" || node instanceof String)) ?
            document.getElementById(node) : (node || null);

        var forms = getChildForms(finalNode);
        var result = fetchWindowIdFromForms(forms);
        return (null != result) ? result : fetchWindowIdFromURL();


    };


    /**
     * The namespace for JavaServer Faces JavaScript utilities.
     * @name jsf.util
     * @namespace
     */
    jsf.util = {};

    /**
     * <p>A varargs function that invokes an arbitrary number of scripts.
     * If any script in the chain returns false, the chain is short-circuited
     * and subsequent scripts are not invoked.  Any number of scripts may
     * specified after the <code>event</code> argument.</p>
     *
     * @param source The DOM element that triggered this Ajax request, or an
     * id string of the element to use as the triggering element.
     * @param event The DOM event that triggered this Ajax request.  The
     * <code>event</code> argument is optional.
     *
     * @returns boolean <code>false</code> if any scripts in the chain return <code>false</code>,
     *  otherwise returns <code>true</code>
     *
     * @function jsf.util.chain
     */
    jsf.util.chain = function (source, event) {

        if (arguments.length < 3) {
            return true;
        }

        // RELEASE_PENDING rogerk - shouldn't this be getElementById instead of null
        var thisArg = (typeof source === 'object') ? source : null;

        // Call back any scripts that were passed in
        for (var i = 2; i < arguments.length; i++) {

            var f = new Function("event", arguments[i]);
            var returnValue = f.call(thisArg, event);

            if (returnValue === false) {
                return false;
            }
        }
        return true;

    };

    /**
     * <p class="changed_added_2_2">The result of calling
     * <code>UINamingContainer.getNamingContainerSeparatorChar().</code></p>
     */
    jsf.separatorchar = ':';

    /**
     * <p>An integer specifying the specification version that this file implements.
     * It's format is: rightmost two digits, bug release number, next two digits,
     * minor release number, leftmost digits, major release number.
     * This number may only be incremented by a new release of the specification.</p>
     */
    jsf.specversion = 22000;

    /**
     * <p>An integer specifying the implementation version that this file implements.
     * It's a monotonically increasing number, reset with every increment of
     * <code>jsf.specversion</code>
     * This number is implementation dependent.</p>
     */
    jsf.implversion = 3;


} //end if version detection block
/*
 * DO NOT ALTER OR REMOVE COPYRIGHT NOTICES OR THIS HEADER.
 *
 * Copyright 1997-2008 Sun Microsystems, Inc. All rights reserved.
 *
 * The contents of this file are subject to the terms of either the GNU
 * General Public License Version 2 only ("GPL") or the Common Development
 * and Distribution License("CDDL") (collectively, the "License").  You
 * may not use this file except in compliance with the License. You can obtain
 * a copy of the License at https://glassfish.dev.java.net/public/CDDL+GPL.html
 * or glassfish/bootstrap/legal/LICENSE.txt.  See the License for the specific
 * language governing permissions and limitations under the License.
 *
 * When distributing the software, include this License Header Notice in each
 * file and include the License file at glassfish/bootstrap/legal/LICENSE.txt.
 * Sun designates this particular file as subject to the "Classpath" exception
 * as provided by Sun in the GPL Version 2 section of the License file that
 * accompanied this code.  If applicable, add the following below the License
 * Header, with the fields enclosed by brackets [] replaced by your own
 * identifying information: "Portions Copyrighted [year]
 * [name of copyright owner]"
 *
 * Contributor(s):
 *
 * If you wish your version of this file to be governed by only the CDDL or
 * only the GPL Version 2, indicate your decision by adding "[Contributor]
 * elects to include this software in this distribution under the [CDDL or GPL
 * Version 2] license."  If you don't indicate a single choice of license, a
 * recipient has the option to distribute your version of this file under
 * either the CDDL, the GPL Version 2 or to extend the choice of license to
 * its licensees as provided above.  However, if you add GPL Version 2 code
 * and therefore, elected the GPL Version 2 license, then the option applies
 * only if the new code is made subject to such option by the copyright
 * holder.
 *
 *
 * This file incorporates work covered by the following copyright and
 * permission notice:
 *
 * Copyright 2004 The Apache Software Foundation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 @project JSF Ajax Library
 @version 2.0
 @description This is the standard implementation of the JSF Ajax Library.
 */

/**
 * Register with OpenAjax
 */
if (typeof OpenAjax !== "undefined" &&
    typeof OpenAjax.hub.registerLibrary !== "undefined") {
    OpenAjax.hub.registerLibrary("mojarra", "www.sun.com", "1.0", null);
}

/**
 * @name mojarra
 * @namespace
 */

/*
 * Create our top level namespaces - mojarra
 */
var mojarra = mojarra || {};


/**
 * This function deletes any hidden parameters added
 * to the form by checking for a variable called 'adp'
 * defined on the form.  If present, this variable will
 * contain all the params added by 'apf'.
 *
 * @param f - the target form
 */
mojarra.dpf = function dpf(f) {
    var adp = f.adp;
    if (adp !== null) {
        for (var i = 0; i < adp.length; i++) {
            f.removeChild(adp[i]);
        }
    }
};

/*
 * This function adds any parameters specified by the
 * parameter 'pvp' to the form represented by param 'f'.
 * Any parameters added will be stored in a variable
 * called 'adp' and stored on the form.
 *
 * @param f - the target form
 * @param pvp - associative array of parameter
 *  key/value pairs to be added to the form as hidden input
 *  fields.
 */
mojarra.apf = function apf(f, pvp) {
    var adp = new Array();
    f.adp = adp;
    var i = 0;
    for (var k in pvp) {
        if (pvp.hasOwnProperty(k)) {
            var p = document.createElement("input");
            p.type = "hidden";
            p.name = k;
            p.value = pvp[k];
            f.appendChild(p);
            adp[i++] = p;
        }
    }
};

/*
 * This is called by command link and command button.  It provides
 * the form it is nested in, the parameters that need to be
 * added and finally, the target of the action.  This function
 * will delete any parameters added <em>after</em> the form
 * has been submitted to handle DOM caching issues.
 *
 * @param f - the target form
 * @param pvp - associative array of parameter
 *  key/value pairs to be added to the form as hidden input
 *  fields.
 * @param t - the target of the form submission
 */
mojarra.jsfcljs = function jsfcljs(f, pvp, t) {
    mojarra.apf(f, pvp);
    var ft = f.target;
    if (t) {
        f.target = t;
    }
    f.submit();
    f.target = ft;
    mojarra.dpf(f);
};

/*
 * This is called by functions that need access to their calling
 * context, in the form of <code>this</code> and <code>event</code>
 * objects.
 *
 *  @param f the function to execute
 *  @param t this of the calling function
 *  @param e event of the calling function
 *  @return object that f returns
 */
mojarra.jsfcbk = function jsfcbk(f, t, e) {
    return f.call(t, e);
};

/*
 * This is called by the AjaxBehaviorRenderer script to
 * trigger a jsf.ajax.request() call.
 *
 *  @param s the source element or id
 *  @param e event of the calling function
 *  @param n name of the behavior event that has fired
 *  @param ex execute list
 *  @param re render list
 *  @param op options object
 */
mojarra.ab = function ab(s, e, n, ex, re, op) {
    if (!op) {
        op = {};
    }

    if (n) {
        op["javax.faces.behavior.event"] = n;
    }

    if (ex) {
        op["execute"] = ex;
    }

    if (re) {
        op["render"] = re;
    }

    jsf.ajax.request(s, e, op);
};