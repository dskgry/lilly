# lilly
JSF ajax request optimization library which stops jsf from submitting all fields of a wrapping form when proper execute-options are set.
This is a possible solution for spec issue 1098 (https://java.net/jira/browse/JAVASERVERFACES_SPEC_PUBLIC-1098).


# usage
Add lilly.min.js after jsf.js to optimize jsfs' ajax requests, e.g.:

< h:outputScript name="jsf.js" library="javax.faces" target="body"/>  

< !—- patch is added AFTER the jsf.js library! -->

< h:outputScript name="lilli.min.js" library="scripts" target="body"/> 
