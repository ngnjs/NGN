# Models

NGN uses models to describe different logical elements of an application. For example, most applications
are designed for use by people. The `Person` model represents a human being. There may be many kinds of
people using the application, each with the same attributes but unique values. A simple example is first and
last name. Models are typically persisted in a data store, and the value of their attributes is what constitutes
the data records saved.

## Using Models

The core models, found in the NGN.model package, represent individual pieces of the application. For example,
NGN.model.Person represents a single individual. NGN.model.Group represents a single group, though that
group may consist of multiple people.

Creating a model is done the same way a normal class is created, i.e.

	var person = new NGN.model.Person();

This single line creates a model representation of a person. If the application needs to represent John Doe,
who was born on January 4th, 1975, simply specify the values:

	person.firstName = 'John';
	person.lastName = 'Doe';
	person.dob = new Date(1975,1,4);

The core models provided by NGN are designed to cover the most common needs. In the case of a person, applications
may alter their content based on a specific dimension, like age. The `Person` model automatically calculates
the age of a person on the fly, based on their date of birth. If the application is designed only for people
age 18+, the following would work:

	if (person.age >= 18)
		console.log('Allowed');
	else
		console.log('Not Allowed');
Each model is designed to offer as much flexibility as possible, with a healthy set of helper attributes/methods
for managing/using the model.

## Custom Attributes

For applications that require attributes that are not a part of the model, or for specific instances
where an extra attribute is required, it is possible to simply add them to the model.
	var person = new NGN.model.Person();
	
	person.firstName = 'John';
	person.lastName = 'Doe';
	person.dob = new Date(1975,1,4);
	
	person.myCustomAttribute = 'Custom Value';
This is useful for small ad-hoc needs. However; some applications may require custom attributes defined for
every person, perhaps with default values. These applications may also require custom helper methods or more
complex validation. For these scenarios, it is best to create a custom model library. This is done exactly
the same way any other NGN class is extended. Existing core models can be extended, or completely new models
can be created by extending the private NGN.model.Model class.

Keep in mind, models are a little different from other classes. They are the only classes that provide
change management functionality.

## Change Management

One of the powerful features NGN models provide is a capability to listen for and intercept change events.
Listening for a change involves using the __#on__ method of a model. For example,
	person.on('change',function(changeObject){
		console.log(changeObject);
	});
The code above will dump a JSON object to the console. A change object contains the following data:
	{
		property: 	'name',								// Name of the attribute that changed.
		type:		'create|update|delete',				// The type of change
		value:		<any>,								// The latest value. Only exists when type = create/update.
		oldValue:	<any>,								// Provides the prior value. Exists only when type = update/delete.
		array:		{									// This object exists only for attributes that are an array.
						index:		<Number>,			// The index of the array that changed.
						action: 	'add|edit|delete',	// What action was performed to the index element
						value:		<any>,				// The latest value of the array index. Only exists when action = add/edit.
						oldValue:	<any>				// The prior value of the array index. Only exists when action = edit/delete.
					}
	}
Using the example, if the person's name is really Jane Doe, then setting `person.firstName = "Jane";`
would fire the change event, passing the following changeObject:
	{
		property: 	'firstName',
		type:		'update',
		oldValue:	'John',
		value:		'Jane'
	}
Additionally, models automatically create an event for each property. In other words, it is possible
to listen for a specific event:
	person.on('changeFirstName', function(changeObject){
		console.log('First name changed from '+changeObject.oldValue+' to '+changeValue.value);
	});
The generated events are created by appending the word `change` to the capitalized attribute name, i.e.
`change`+`FirstName`.

Additionally, a `beforeChange` event exists. Like `change`, a unique `beforeChange` event is also created
for each data attribute of the model. The `beforeChange` event works in the same manner. It can be overridden
to provide event interception. This may be useful for things like data validation, but there are alternative
and simpler ways to accomplish these types of tasks (explained later in this guide).

The change management feature also provides a full change log, accessible on all models by executing
the `getChangeLog()` method. This returns an ordered array of change objects, allowing a complete trace
of how the object has changed since it was saved.

There is also a `rollback()` method, which is essentially a big _undo_ command. By default, this reverts the
model to its prior state by reversing the last change. The method accepts a number, allowing applications
to undo more than one change at a time. To clear changes, a `-1` should be passed, as defined in the documentation.

There is no _redo_ method at this time, so all rollbacks should be done with caution.

### Enabling Change Management

Change management is built on [direct proxies](http://wiki.ecmascript.org/doku.php?id=harmony:direct_proxies) and [weak maps](http://wiki.ecmascript.org/doku.php?id=harmony:weak_maps), 
which are part of the ECMAScript 6 proposed
specification. V8, and therefore node.js, provides experimental support for this through the `--harmony`
flag when launching an application. For example, `node --harmony myapp.js`. 

While this is still technically experimental/draft according to TC39 (ES6 Committee), there are already
implementations in Google V8 (node, Chrome) and Spidermonkey (Mozilla Firefox) that are used in other
popular node modules. NGN uses the fine work of [harmony-reflect](https://github.com/tvcutsem/harmony-reflect/) to assist
with the implementation.

In testing, 90% of the use cases for change management are handled exceptionally well. 
However; with any experimental code, there are some _gotchas_. For most applications, the workarounds
are negligible, if necessary at all.

**Array Gotchas:** No Known!

NGN masks the complexities of managing change of an array by providing a wrapper. 

**RegExp Gotchas:** No Known!

Regular expressions do have some known problems with direct proxies, but NGN provides a wrapper function
around regular expressions, which makes them behave as expected.

**Date Gotchas:** Update methods don't work.

Dates are one of the more complex JavaScript data objects and are not supported very well in any direct proxy
implementation. NGN wraps dates to provide change management. For example, setting an attribute value to
a date or deleting the attribute is not a problem. However; direct proxy support for date methods
does not exist yet. For example, the following JavaScript should work, but will fail:
	var person = new NGN.model.Person();
	
	person.dob = new Date(1980,1,1);
	person.dob.setFullYear(1979);
The example is contrived, but one would expect this to update the birth date to 1/1/1979. However,
this does not work with direct proxies, and therefore fails with NGN models.

_Workaround:_

To work around this issue, it is best to use a standard variable to do all date maniulations. The
prior example could be modified to:
	var person = new NGN.model.Person();
	
	person.dob = new Date(1980,1,1); // <-- Triggers the create event
	
	// Workaround
	var modifiedDate = person.dob;
	modifiedDate.setFullYear(1979);
	
	person.dob = modifiedDate; // <-- Triggers the change event
The net effect of this code will create the birth date of 1/1/1980, then fire a `change`/`changeDob` event
when the date is set to 1/1/1979.

## Data Validation

Models support data validation using the __#addValidator__ method. There are several built in validation
utilities, including basic matching (i.e. String == String), Regular Expression pattern matching, enumeration,
and custom validation functions.

## Associations: Related Models

Sometimes a model needs to contain nested models as properties of its own. For example, a `Group` may contain
multiple `Person` models. NGN identifies relationship between models through associations (NGN.model.data.Association).

Assocations allow developers to provide relationship rules, such as cardinality and referential integrity. If this 
sounds like relational database speak, that's because it is. Since many applications maintain relationships
between different entities, NGN has employed a type of modeling capable of enforcing these associations. This does
not mean an application must use a relational database. NGN natively supports several NoSQL data stores.

For information about using associations, please see the related guide.

## Models & Data Storage

Due to the nature of models and their capability to validate data, manage associations, and monitor data/state change,
they act as a simplified variation of [ORM](http://en.wikipedia.org/wiki/Object-relational_mapping). Developers can choose
to use associations or not, leaving the choice of "to ORM or not to ORM" up to the developer.

//TODO: Complete this when the data manager class is complete and the extended class for mongo.
