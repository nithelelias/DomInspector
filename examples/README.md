# Some examples to extend the knowledge

## INPUTS EXAMPLES

#### Example input 1
 [Link to Example](https://github.com/examples/input1.html): 
  Simple input two way data binding.
```html
 <input model="mypoo.name" /> &nbsp; =  {{mypoo.name}}   
```
Input goes to data of the object and the data can be access in another node 

#### Example input 2
[Link to Example](https://github.com/examples/input2.html): 

Using the Inputs: text, radio, checkbox, select, text area
```html
   <p>Name:<input model="mypoo.name" /> </p>
    <!-- INPUT RADIO WITH SAME MODEL DIFFERENT VALUES-->
    Gender:
    <ul>
      <li><label>Male <input type="radio" value="male" model="mypoo.gender" name="gender"></label></li>
      <li><label>Female <input type="radio" value="female" model="mypoo.gender" name="gender"></label> 
    </ul>
    <br>
    <!-- INPUT CHECKBOX WITH SAME MODEL DIFFERENT VALUES-->
    Abilities:
    <ul>
      <li><label>Cook <input type="checkbox" value="Cook" model="mypoo.abilities" name="abilities"></label></li>
      <li><label>Dance <input type="checkbox" value="Dance" model="mypoo.abilities" name="abilities"></label></li>
      <li><label>Sleep <input type="checkbox" value="Sleep" model="mypoo.abilities" name="abilities"></label></li>
    </ul>
    <br>
    <!-- SELECT WITH MODEL AND HTML TO INJECT THE HTML OPTIONS-->
    <label for="born">
      Year Born
      <select name="born" model="mypoo.born" >
        <option>1970</option>
        <option>1971</option>
        <option>1972</option>
        <option>1980</option>
        ...
      </select>
    </label>
    <!-- TEXT AREA WITH MODEL-->
    <br>
    <p><textarea model="mypoo.resume" cols="30" rows="10" name="resume"></textarea></p>
   
```

## ADDING COMPONENTS

#### Example multiple-components 
[link to example](https://github.com/examples/multiple-components.html): 

Adding multiple components and ... a timer?.
```html
   <div com="Poo as mypoo,Poo as imbob,Timer as timer" > 
        <!-- my component with his default name-->
        <p>Poo:<input model="mypoo.name" /> =&nbsp;{{mypoo.name}}</p>
        <!-- my component with new default name-->
        <p>Bob:<input model="imbob.name" value="Bob"/> =&nbsp;{{imbob.name}}</p>
        <!-- A TIMER TO UPDATE ... time-->
        <p>Time:{{timer.time}}</p>
    </div>
```

#### Example multiple-components 2
[link to example](https://github.com/examples/multiple-components2.html): 

Adding multiple components separately.
```html
   <div>
     <!-- A TIMER TO UPDATE ... time-->
    <p com="timer">Time:{{timer.time}}</p>
    <!-- my component with his default name-->
    <p com="Poo as mypoo">Poo:<input model="mypoo.name" /> =&nbsp;{{mypoo.name}}</p>
    <!-- my component with new default name-->
    <p com="Poo as imbob">Bob:<input model="imbob.name" value="Bob" /> =&nbsp;{{imbob.name}}</p>
   </div>
```

### Repetitions

#### Example Repeat
[link to example](https://github.com/examples/repeat.html): 

Repeating elements
```html
   <div com="Poo as mypoo">
    <ul>
        <li repeat="color in mypoo.colors">{{color}}</li>
    </ul>
  </div>
   <script type="text/javascript">
    function PooClass() {
      this.colors = ["red","blue","green","yellow"]; 
    }
    $.Inspector.add("Poo", PooClass);
  </script>
```

#### Example Repeat 2
[link to example](https://github.com/examples/repeat2.html): 

Repeating elements using html tag to embed html
```html
  <div com="Poo as mypoo"> 
    Items
    <ul html="mypoo.getList()"> </ul>
  </div>
  <script type="text/javascript">
    function PooClass() {      
      this.items = ["blue","red","yellow","green"];
      this.getList = function () { 
        // this will return a string with html tags to be write.
        return (this.items.map(function (_name, _index) {
          return `<li>${_index})- ${_name}   </li>`;
        }).join(""));
      };
    }
    $.Inspector.add("Poo", PooClass);
```

#### Example Repeat 3
[link to example](https://github.com/examples/repeat3.html): 

Repeating elements using html tag to embed html dinamically
```html
  <div com="Poo as mypoo"> 
    <!-- input to add new item name-->
    <form onsubmit="return mypoo.add();">
      <input model="mypoo.name" />        
      <!-- click to add a new name on the object mypooo -->
      <button type="submit" onclick="mypoo.add();"> add </button> 
    </form> 
    <hr>
    Items
    <ul html="mypoo.getList()"> </ul>
  </div>
  <script type="text/javascript">
    function PooClass() {
      this.name="";
      this.items = [];
      // this method will add new name if not null or empty
      this.add = function () {
        if (this.name.trim().length > 0) {
          this.items.push(this.name);
          this.name = '';
        }
        return false;
      };
      // this will cut the array of names
      this.remove = function (_index) {
        this.items.splice(_index, 1);
      }
      this.getList = function () {
        // get instance name of this object on scope
        let _instanceName = this.$instanceName;
        // this will return a string with html tags to be write.
        return (this.items.map(function (_name, _index) {
          return `<li>${_index})- ${_name}   &nbsp; <button onclick='${_instanceName}.remove( ${_index})'> remove </button> </li>`;
        }).join(""));
      };
    }
    $.Inspector.add("Poo", PooClass);
  </script>
```


### Includes

#### Example include
[link to example](https://github.com/examples/include1.html): 

Include the div an js separately
```html      
    <!-- include only a div with the name-->
    <Include src="include-div.html" />
    <!-- Include a js with the Div Bind Class-->
    <Include src="include-div.js" />

```

[link to example](https://github.com/examples/include2.html): 

Include several files with , separated
```html    
    <Include src='include-div.js,include-div.html' />
    
```

[link to example](https://github.com/examples/include3.html): 

Include from file .json or .com
```html    
    <!-- include from file .json or .com -->
    <Include src='include-div.json' />      
```
