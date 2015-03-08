# lilly
JSF ajax request optimazation library which stops jsf from submitting the whole form when the execute-options are set.
This is a possible solution for spec issue 1098 (https://java.net/jira/browse/JAVASERVERFACES_SPEC_PUBLIC-1098).


# usage
Add lilly.min.js after jsf.js to optimize jsfs' ajax requests, e.g.:

<h:outputScript name="jsf.js" library="javax.faces" target="body"/>  
<!—- patch is added AFTER the jsf.js library! -->
<h:outputScript name="lilli.js" library="scripts" target="body"/> 
