/**
 * @author Sven Koelpin
 */
(function (w) {

    //create mock form
    beforeAll(function () {
        var form = w.document.createElement("form");
        form.setAttribute("id", "form");
        form.setAttribute("name", "form");

        var container = w.document.createElement("div");
        container.setAttribute("id", "form:container");
        container.setAttribute("name", "form:container");


        //form elms
        for (var i = 0; i < 3; i++) {
            var input = w.document.createElement("input");
            input.setAttribute("type", "text");
            input.setAttribute("name", "form:input" + i);
            input.setAttribute("id", "form:input" + i);
            input.value = "value" + i
            container.appendChild(input);
        }

        form.appendChild(container);


        //mandatory elms generated by jsf
        var formHidden = w.document.createElement("input");
        formHidden.setAttribute("type", "hidden");
        formHidden.setAttribute("name", "form");
        formHidden.setAttribute("value", "form");
        form.appendChild(formHidden);

        var viewStateHidden = w.document.createElement("input");
        viewStateHidden.setAttribute("type", "hidden");
        viewStateHidden.setAttribute("name", "javax.faces.ViewState");
        viewStateHidden.setAttribute("value", "123:456");
        viewStateHidden.setAttribute("id", "form:javax.faces.ViewState:0");
        form.appendChild(viewStateHidden);

        var submit = w.document.createElement("input");
        submit.setAttribute("type", "submit");
        submit.setAttribute("id", "form:submit");
        form.appendChild(submit);
        w.document.getElementsByTagName("body")[0].appendChild(form);


    });

    beforeEach(function () {
        //mock jsf.ajax.request
        jsf.ajax.request = function (source, event, options) {
            w.Lilly._setExecuteSrc(source);
            w.Lilly._setExecuteOptions(options.execute);
        };
    });

    var createQueryStringComponents = function (queryString) {
        if (!queryString || queryString.length === 0) {
            return {};
        }
        var keyValMap = {};
        var keyValPairs = queryString.split("&");
        keyValPairs.forEach(function (pair) {
            var key = pair.split("=")[0];
            var val = pair.split("=")[1];
            keyValMap[key.replace(/%3A/g, ":")] = val;
        });
        return keyValMap;
    };

    describe("lilly", function () {
        it("requires jsf to work", function () {
            var _jsf = jsf;
            jsf = undefined;
            expect(function () {
                Lilly();
            }).toThrow();
            jsf = _jsf;
        });
        it("serialises all elements when executing @form", function () {
            jsf.ajax.request(w.document.getElementById("form:submit"), "click", {
                execute: "@form"
            });
            var queryStringComponents = createQueryStringComponents(jsf.getViewState(w.document.getElementById("form")));
            expect(Object.keys(queryStringComponents).length).toBe(5);
            expect(queryStringComponents["form"]).toEqual("form");
            expect(queryStringComponents["javax.faces.ViewState"]).toEqual("123%3A456");
            expect(queryStringComponents["form:input0"]).toEqual("value0");
            expect(queryStringComponents["form:input1"]).toEqual("value1");
            expect(queryStringComponents["form:input2"]).toEqual("value2");
        });
        it("serialises all elements when executing @all", function () {
            jsf.ajax.request(w.document.getElementById("form:submit"), "click", {
                execute: "@all"
            });
            var queryStringComponents = createQueryStringComponents(jsf.getViewState(w.document.getElementById("form")));
            expect(Object.keys(queryStringComponents).length).toBe(5);
            expect(queryStringComponents["form"]).toEqual("form");
            expect(queryStringComponents["javax.faces.ViewState"]).toEqual("123%3A456");
            expect(queryStringComponents["form:input0"]).toEqual("value0");
            expect(queryStringComponents["form:input1"]).toEqual("value1");
            expect(queryStringComponents["form:input2"]).toEqual("value2");
        });
        it("serialises all elements when executing the form-id", function () {
            jsf.ajax.request(w.document.getElementById("form:submit"), "click", {
                execute: "form"
            });
            var queryStringComponents = createQueryStringComponents(jsf.getViewState(w.document.getElementById("form")));
            expect(Object.keys(queryStringComponents).length).toBe(5);
            expect(queryStringComponents["form"]).toEqual("form");
            expect(queryStringComponents["javax.faces.ViewState"]).toEqual("123%3A456");
            expect(queryStringComponents["form:input0"]).toEqual("value0");
            expect(queryStringComponents["form:input1"]).toEqual("value1");
            expect(queryStringComponents["form:input2"]).toEqual("value2");
        });
        it("serialises no elements (except for viewstate) when executing @none", function () {
            jsf.ajax.request(w.document.getElementById("form:submit"), "click", {
                execute: "@none"
            });
            var queryStringComponents = createQueryStringComponents(jsf.getViewState(w.document.getElementById("form")));
            expect(Object.keys(queryStringComponents).length).toBe(1);
            expect(queryStringComponents["javax.faces.ViewState"]).toEqual("123%3A456");
        });
        it("serialises only form:input0 when executing form:input0", function () {
            jsf.ajax.request(w.document.getElementById("form:submit"), "click", {
                execute: "form:input0"
            });
            var queryStringComponents = createQueryStringComponents(jsf.getViewState(w.document.getElementById("form")));
            expect(Object.keys(queryStringComponents).length).toBe(3);
            expect(queryStringComponents["form"]).toEqual("form");
            expect(queryStringComponents["javax.faces.ViewState"]).toEqual("123%3A456");
            expect(queryStringComponents["form:input0"]).toEqual("value0");
        });
        it("serialises only form:input0,form:input2 when executing form:input0 form:input2", function () {
            jsf.ajax.request(w.document.getElementById("form:submit"), "click", {
                execute: "form:input0 form:input2"
            });
            var queryStringComponents = createQueryStringComponents(jsf.getViewState(w.document.getElementById("form")));
            expect(Object.keys(queryStringComponents).length).toBe(4);
            expect(queryStringComponents["form"]).toEqual("form");
            expect(queryStringComponents["javax.faces.ViewState"]).toEqual("123%3A456");
            expect(queryStringComponents["form:input0"]).toEqual("value0");
            expect(queryStringComponents["form:input2"]).toEqual("value2");
        });
        it("serialises only form:input0,form:input1, form:input2 when executing form:input0 form:input1 form:input2", function () {
            jsf.ajax.request(w.document.getElementById("form:submit"), "click", {
                execute: "form:input0 form:input1 form:input2"
            });
            var queryStringComponents = createQueryStringComponents(jsf.getViewState(w.document.getElementById("form")));
            expect(Object.keys(queryStringComponents).length).toBe(5);
            expect(queryStringComponents["form"]).toEqual("form");
            expect(queryStringComponents["javax.faces.ViewState"]).toEqual("123%3A456");
            expect(queryStringComponents["form:input0"]).toEqual("value0");
            expect(queryStringComponents["form:input2"]).toEqual("value2");
        });
        it("serialises form when @form is present", function () {
            jsf.ajax.request(w.document.getElementById("form:submit"), "click", {
                execute: "form:input0 @form"
            });
            var queryStringComponents = createQueryStringComponents(jsf.getViewState(w.document.getElementById("form")));
            expect(Object.keys(queryStringComponents).length).toBe(5);
            expect(queryStringComponents["form"]).toEqual("form");
            expect(queryStringComponents["javax.faces.ViewState"]).toEqual("123%3A456");
            expect(queryStringComponents["form:input0"]).toEqual("value0");
            expect(queryStringComponents["form:input2"]).toEqual("value2");
        });
        it("serialises form when @all is present", function () {
            jsf.ajax.request(w.document.getElementById("form:submit"), "click", {
                execute: "form:input0 @all"
            });
            var queryStringComponents = createQueryStringComponents(jsf.getViewState(w.document.getElementById("form")));
            expect(Object.keys(queryStringComponents).length).toBe(5);
            expect(queryStringComponents["form"]).toEqual("form");
            expect(queryStringComponents["javax.faces.ViewState"]).toEqual("123%3A456");
            expect(queryStringComponents["form:input0"]).toEqual("value0");
            expect(queryStringComponents["form:input2"]).toEqual("value2");
        });
        it("serialises nothing when @none is present", function () {
            jsf.ajax.request(w.document.getElementById("form:submit"), "click", {
                execute: "form:input0 @none"
            });
            var queryStringComponents = createQueryStringComponents(jsf.getViewState(w.document.getElementById("form")));
            expect(Object.keys(queryStringComponents).length).toBe(1);
            expect(queryStringComponents["javax.faces.ViewState"]).toEqual("123%3A456");
        });
        it("serialises nothing when no execute options is present", function () {
            jsf.ajax.request(w.document.getElementById("form:submit"), "click", {
            });
            var queryStringComponents = createQueryStringComponents(jsf.getViewState(w.document.getElementById("form")));
            expect(Object.keys(queryStringComponents).length).toBe(2);
            expect(queryStringComponents["form"]).toEqual("form");
            expect(queryStringComponents["javax.faces.ViewState"]).toEqual("123%3A456");
        });
        it("serialises nothing when executing @this and @this is a submit control", function () {
            jsf.ajax.request(w.document.getElementById("form:submit"), "click", {
                execute: "@this"
            });
            var queryStringComponents = createQueryStringComponents(jsf.getViewState(w.document.getElementById("form")));
            expect(Object.keys(queryStringComponents).length).toBe(2);
            expect(queryStringComponents["form"]).toEqual("form");
            expect(queryStringComponents["javax.faces.ViewState"]).toEqual("123%3A456");
        });
        it("serialises input1 when executing @this and @this is input1", function () {
            jsf.ajax.request(w.document.getElementById("form:input1"), "keyup", {
                execute: "@this"
            });
            var queryStringComponents = createQueryStringComponents(jsf.getViewState(w.document.getElementById("form")));
            expect(Object.keys(queryStringComponents).length).toBe(3);
            expect(queryStringComponents["form"]).toEqual("form");
            expect(queryStringComponents["javax.faces.ViewState"]).toEqual("123%3A456");
            expect(queryStringComponents["form:input1"]).toEqual("value1");
        });
        it("serialises input1 when executing @this and @this is input1", function () {
            jsf.ajax.request(w.document.getElementById("form:input1"), "keyup", {
                execute: "@this"
            });
            var queryStringComponents = createQueryStringComponents(jsf.getViewState(w.document.getElementById("form")));
            expect(Object.keys(queryStringComponents).length).toBe(3);
            expect(queryStringComponents["form"]).toEqual("form");
            expect(queryStringComponents["javax.faces.ViewState"]).toEqual("123%3A456");
            expect(queryStringComponents["form:input1"]).toEqual("value1");
        });
        it("serialises @form when a non-form element is executed", function () {
            jsf.ajax.request(w.document.getElementById("form:input1"), "keyup", {
                execute: "form:container"
            });
            var queryStringComponents = createQueryStringComponents(jsf.getViewState(w.document.getElementById("form")));
            expect(Object.keys(queryStringComponents).length).toBe(5);
            expect(queryStringComponents["form"]).toEqual("form");
            expect(queryStringComponents["javax.faces.ViewState"]).toEqual("123%3A456");
            expect(queryStringComponents["form:input0"]).toEqual("value0");
            expect(queryStringComponents["form:input1"]).toEqual("value1");
            expect(queryStringComponents["form:input2"]).toEqual("value2");
        });
        it("serialises @form when an unknown element is executed", function () {
            jsf.ajax.request(w.document.getElementById("form:input1"), "keyup", {
                execute: "SOMETHING"
            });
            var queryStringComponents = createQueryStringComponents(jsf.getViewState(w.document.getElementById("form")));
            expect(Object.keys(queryStringComponents).length).toBe(5);
            expect(queryStringComponents["form"]).toEqual("form");
            expect(queryStringComponents["javax.faces.ViewState"]).toEqual("123%3A456");
            expect(queryStringComponents["form:input0"]).toEqual("value0");
            expect(queryStringComponents["form:input1"]).toEqual("value1");
            expect(queryStringComponents["form:input2"]).toEqual("value2");
        });
        it("serialises @form when no execute options are set and a non-form-element is the source element", function () {
            jsf.ajax.request(w.document.getElementById("form:container"), null, {
            });
            var queryStringComponents = createQueryStringComponents(jsf.getViewState(w.document.getElementById("form")));
            expect(Object.keys(queryStringComponents).length).toBe(5);
            expect(queryStringComponents["form"]).toEqual("form");
            expect(queryStringComponents["javax.faces.ViewState"]).toEqual("123%3A456");
            expect(queryStringComponents["form:input0"]).toEqual("value0");
            expect(queryStringComponents["form:input1"]).toEqual("value1");
            expect(queryStringComponents["form:input2"]).toEqual("value2");
        });
        it("serialises @form when no execute options are set and an unknown element is the source element", function () {
            jsf.ajax.request(w.document.getElementById("STH"), null, {
            });
            var queryStringComponents = createQueryStringComponents(jsf.getViewState(w.document.getElementById("form")));
            expect(Object.keys(queryStringComponents).length).toBe(5);
            expect(queryStringComponents["form"]).toEqual("form");
            expect(queryStringComponents["javax.faces.ViewState"]).toEqual("123%3A456");
            expect(queryStringComponents["form:input0"]).toEqual("value0");
            expect(queryStringComponents["form:input1"]).toEqual("value1");
            expect(queryStringComponents["form:input2"]).toEqual("value2");
        });
    });
})(window);