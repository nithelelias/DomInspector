# Jquery Dom Inspector
This project started with the idea of none use heavy frameworks to render data objects in the dom or html pages, instead use the native html tags and properties to use with minimal learning curve.


## Requirements?
It use JQuery as a require library for accesing dom easy.

## Installing
Just Download and put it all the way down with JQUERY

```html
<script type="text/javascript" src="jquery.js"></script>   
<script type="text/javascript" src="jquery.inspector.js"></script> 
```


## How It Works?

It create some easy binding  objects with the HTML to recognize changes of the object to update only the child node related, instead of all the page or all the parent node.

```html 
  <div com="Poo as mypoo">
    <!-- data binded to mypoo.name object  -->
    {{mypoo.name}}
    <br>
     <!-- input with the model or data-source  -->
    <input model="mypoo.name" />     
    <!-- click to clear the data will be clear and also will be updated-->
    <button onclick="mypoo.name='';"> clear </button>&nbsp;
  </div>
 
  <script type="text/javascript" src="jquery.min.js"></script>
  <script type="text/javascript" src="jquery.inspector.js"></script>
  <script type="text/javascript">
    function PooClass() {
      this.name = "I am willie the poo";    
    }
    // TELL INSPECTOR TO ADD THIS OBJECT
    $.Inspector.add("Poo", PooClass);
  </script> 
```
### Inspection
The inspector "INSPECT" the dom to validate if there is some components/Objects bind to them ( yes like some frameworks... ¬¬ dont judge me)
```html
 <div com="Poo as mypoo">{{mypoo.name}}</div>
```

To make this happend you can use several propertie names:
```
data-bind, bind, data-com, com
```
### Tags, properties and actions

The Inspector use native HTML properties to read events like onclick, onchange,onblur,onfocus,on... you can use it to access the object on the HTML tag, but also add some properties and tags to work with.

* **model** : This property as implied work as a two way data bind on inputs(text,checks,radio,etc...) , selects and textareas, it object change his property it will refresh the input,and if the input change his value it will update the property.

* **html** : This property as implied add html content in innerHTML property the indicated Dom, it best use to not show the braces {{ --expression-- }} on the html before the object has been compiled, instead it will add a comment 

* **repeat** : This property it will clone the dom to repeat itself  using a for iteration:
```
item in items
```
Where **items** is an array/dic/hash/obj and **item** is the value iterator who can have inner properties or a value itself, Ex:

```html
    <ul>
        <li repeat="color in mypoo.colors">{{color}}</li>
    </ul>
    <script type="text/javascript">
        function PooClass() {
        this.colors = ["red","blue","green","yellow"];        
        }
        $.Inspector.add("Poo", PooClass);
  </script>
```

* **include** : This tag is used to load files as htmls, js , css or a full stack or files, Ex:

** Load html:
```html
<include src="poocomponent.html" />
```
** Load js:
```html
<inlcude src="poocomponent.js">
```
** Load full stack of files (pooocomponent.com):
```
["./pooocomponent.css","./poocomponent.js","./pooocomponent.html"]
```
```html
<include src="poocomponent.com" />
```

### Examples:
 A list with some examples i will be adding more
 [Examples](examples/README.md)


 ### Methods:

 * **add** : Add a component to be binded.
 * **remove** : Remove a Component bind to not be used as binded also it will remove the dom element.
 * **clear** : Remove all component binds.
 * **run** : Execute a lookup search to update bindings.
 * **Includer**: Object used to load files as .html, .js, .mjs, .css, .com on the html document

## Authors

* **Nithel Elias** - *Initial work* - [Nithel Elias](https://github.com/nithelelias)

Colombian Senior Developer

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details

 