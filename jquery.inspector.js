(function (owner) {

    var Inspector = {
        DEV: false, // SET THIS TO TRUE TO LET WARNING LOGS GO        
        version: "1.0.0.5",
        run: run,
        add: add,
        remove: remove,
        clear: clear,
        attrselector: "data-bind,bind,data-com,com,data-comp,comp",
        Components: ComponentHandler(),
        Includer: IncluderHandler(),
        cicles: 0,
        // VECES QUE VA PREGUNTAR POR EL COMPONENTE, ESTO ES POR SI EL COMPONENTE YA NO ESTA ANIDADO AL DOCUMENTO, PARA EVITAR FATIGA LO REMOVERA.
        MAX_TRYOUT_COMPONENT: 5
    };
    // DECLARA LOS EVENTOS DEL DOM QUE SE RECONOCERAN.
    let USER_EVENTS = ["onclick", "onchange", "onsubmit", "onblur", "onkeydown", "onkeyup", "onmousedown", "onmouseup", "onmouseover", "onmouseout", "onload", "hover"];
    let timeOutToRefreshPostComponents = null;
    var $Iterations = {
        total: 0
    };
    var $innerScope = {};
    var timeoutToLooUpComponents = null;
    owner.$.Inspector = Inspector;
    window.onload = function () {
        setTimeout(Inspector.Includer.getIncludes, 100);
    }


    // ESTE METODO AGREGA UN COMPONENTE NUEVO.
    function add(tagname, fnclass) {
        // -- console.log("add class", tagname);
        Inspector.Components.Classes[tagname] = fnclass;
        lookUpComponents();
    }
    // ESTE METODO REMUEVE UN COMPONENTE 
    function remove(tagname) {
        for (let key in Inspector.Components.binds) {
            if (key.indexOf(" as ") > -1 && tagname == key.split(" as ")[1] || tagname == key) {
                if (Inspector.Components.binds[key].$el != null) {
                    Inspector.Components.binds[key].$el.remove();
                }
                if (!Inspector.Components.binds[key].temp) {
                    Inspector.Components.binds[key].delete();
                }
                delete Inspector.Components.binds[key];
                break;
            }
        }
    }
    // ESTO METODO REMUEVE TODOS LOS COMPONENTES
    function clear() {
        // REMOVE ALL COMPONENTS
        return new Promise((resolve, reject) => {

            for (let key in Inspector.Components.binds) {
                if (Inspector.Components.binds[key].$el != null) {
                    Inspector.Components.binds[key].$el.remove();
                }
                if (!Inspector.Components.binds[key].temp) {
                    Inspector.Components.binds[key].delete();
                }
                delete Inspector.Components.binds[key];
            }
            delete Inspector.Components.binds;
            Inspector.Components.binds = {};
            // CLEAN ALL CSS ELEMENTS
            $(".include-css").remove();
            Inspector.Includer.clear();
            // CLEAN ALL JS ELEMENTS            $(".include-js").remove();
            resolve();
        });
    }

    function run() {
        clearTimeout(timeoutToLooUpComponents);
        timeoutToLooUpComponents = setTimeout(lookUpComponents, 100);
    }
    function lookUpComponents() {  // ON DOM READY  RUN COMPONENT
        let selectores = [].concat(Inspector.attrselector.split(","));
        function searchForComponentsWith(attrselector) {
            let total_found = $("[" + attrselector + "]").length;
            if (total_found == 0) {
                return false;
            }
            $("[" + attrselector + "]").each(function () {
                let $el = $(this);
                let componentsName = $el.attr(attrselector).split(",");
                if (this.__inspected == null) {
                    initDomInspector($el, attrselector).then(function () {
                        // COMPONENT READY
                    });
                    let waitTillIncludesEnd = function () {
                        if ($("include", $el).length > 0) {
                            //console.log("STILL INCLUDES TO LOAD wait -", tagname);
                            setTimeout(waitTillIncludesEnd, 100);
                        } else {

                            //$el.get(0).Inspector.inspect();
                            // $el.get(0).Inspector.update();
                        }
                    };
                    // SI HAY INCLUDES ABAJO DE MI.
                    waitTillIncludesEnd();
                    this.__inspected = true;
                }
                // add component
                componentsName.forEach(function (tagname, index) {
                    tagname = tagname.trim();
                    //console.log(tagname,"exist?",Inspector.Components.binds.hasOwnProperty(tagname));
                    if (tagname.toLowerCase().indexOf(" as ") == -1) {
                        let countTagName = 1;
                        let realtagname = tagname.trim();
                        tagname = realtagname + " as " + realtagname.toLowerCase();
                        while (Inspector.Components.binds.hasOwnProperty(tagname)) {
                            countTagName++;
                            tagname = realtagname + " as " + realtagname.toLowerCase() + countTagName;
                        }

                        $el.attr(attrselector, tagname)
                    }
                    let splitedActors = tagname.split(" as ");
                    let compConstructorName = splitedActors[0].trim();
                    let instanceActor = splitedActors[1];
                    // VALIDA SI LA CLASE EXISTE.
                    if (Inspector.Components.Classes.hasOwnProperty(compConstructorName)) {
                        // SI NO TIENE WATCHERS O NO TIENE EL WATCHER DEL COMPONENTE CREALO       && SI EL BINDING NO EXISTE
                        if (
                            $el.get(0).$ComWatchers == null ||
                            (!$el.get(0).$ComWatchers.hasOwnProperty(compConstructorName) ||
                                !Inspector.Components.binds.hasOwnProperty(tagname))) {

                            Inspector.Components.binds[tagname] = new ComponentWatcher($el, instanceActor, compConstructorName, Inspector.Components.Classes[compConstructorName]);
                            Inspector.Components.binds[tagname].onCallToRender = function () {
                                if ($el != null) {
                                    Inspector.Components.render($el);
                                }
                            };
                        }
                    } else {
                        // TEMPORAL Object CUZ IS NOT FOUND THE CLASS 
                        Inspector.Components.binds[tagname] = {
                            temp: true,
                            instance: {}
                        };
                    }

                });
            });
        }
        for (let i in selectores) {
            searchForComponentsWith(selectores[i]);
        }
        // CALL TO REFRESH VIEW
        setTimeout(callToRefreshView);
    }

    // ESTE METODO DEVUELVE UN HANDLER PARA LOS COMPONENTES
    function ComponentHandler() {
        return {
            Classes: {},
            binds: {},
            render: function ($el) {
                // IF ELEMENT NODE EXIST AND HAS INSPECTOR
                if ($($el).length > 0 && $($el).get(0).isConnected && $($el).get(0).hasOwnProperty("Inspector")) {
                    // VALIDATEIF IS BEEN RAWING
                    if ($el.get(0).$dirty) {
                        // RETURN TRY COUNT TO 0
                        $el.get(0).try_count = 0;
                        // HERE UPDATE ... THE VIEW...
                        $($el).get(0).Inspector.update().then(() => {
                            $el.get(0).$dirty = false;
                        });

                    }
                    return true;
                } else if ($el != null) {
                    // GET TRY COUNT AND ADD 1 COUNT.
                    $el.get(0).try_count = $el.get(0).try_count || 0;
                    $el.get(0).try_count++;
                    if (Inspector.DEV) {
                        console.log("TRY TO REACH:", $el.get(0).Inspector.component(), $el.get(0).try_count)
                    }
                    if ($el.get(0).try_count > Inspector.MAX_TRYOUT_COMPONENT) {
                        // EXCEED TRY COUNT THIS ELEMENT HAS BEEN REMOVED
                        if (Inspector.DEV) {
                            console.warn("Element has been removed from long time -- IT WILL BE ERASED FROM BINDINGS NOW", $el);
                        }
                        $el.remove();
                        Inspector.remove($el.get(0).Inspector.component());
                    }
                }
                return false;
            }
        }

    }
    // ESTE METODO CREA UN HANDLER PARA LOS INCLUDES SOLOS E EJECUTA UNA SOLA VEZ AL PRINCIPIO
    function IncluderHandler() {

        var libs_dic_temp = {};
        var temporal_request = {};
        let callbacks = {
            html: function (_at, _html) {
                let dfd = $.Deferred();
                try {
                    if (_at == null) {
                        dfd.reject();
                        return dfd.promise();
                    }
                    // VALIDATE IF FOR RENDERING THIS TAG HAS BEEN UNATTACH THEN FOUND IF THERES ANY WITH SAME SRC
                    if (!_at.isConnected) {
                        _at = $(_at.tagName.toLowerCase() + `[src='${_at.attributes.src.value}']`).get(0)
                    }
                    if (_at == null) {
                        dfd.reject();
                        return dfd.promise();
                    }
                    if (!_at == null || !_at.isConnected) {
                        try {
                            dfd.reject();
                            _at.remove();

                        } catch (e) {
                            console.warn(e);
                        }
                        return;
                    }
                    $(_html).insertAfter(_at);

                    _at.remove();

                    setTimeout(function () {
                        // call again if there is inner views daña losthis  
                        //getIncludes();

                        callToRefreshView();
                        // SI EL INCLUDE TIENE EL METODO ONLOAD
                        if (_at.onload != null) {
                            function tryToExecuteOnload() {
                                let $scope = getComponentScope();
                                let totalComponents = Object.keys($scope);
                                if (totalComponents.length > 0) {
                                    with ($scope) {
                                        try {
                                            evaluated_ex_result = eval(_at.attributes.onload.value);
                                        } catch (e) {
                                            console.warn(e);
                                        }
                                    }
                                } else {
                                    setTimeout(tryToExecuteOnload, 100);
                                }
                            }
                            tryToExecuteOnload();
                        }
                        dfd.resolve();
                    }, 1);
                } catch (e) {
                    console.log(e);
                    dfd.reject();
                }
                return dfd.promise();
            },
            js: function (_at, src) {
                let dfd = $.Deferred();
                let ext = (([].concat(src.split("."))).pop() + "").toLowerCase();
                let ismodule = false;
                // APPEND JS IF NOT LOADED BEFORE.               
                if (ext.indexOf(":module") > -1) {
                    ismodule = true;
                    src = src.substring(0, src.lastIndexOf(":module"));
                } else if (ext == "mjs") {
                    ismodule = true;
                }
                // APPEND JS IF NOT LOADED BEFORE.
                if (!foundIfLibExist(src, "script", "src")) {
                    var s = document.createElement("script");
                    s.src = src;
                    s.type = ismodule ? "module" : "text/javascript";
                    s.classList.add("include-js");
                    s.onload = function () {
                        dfd.resolve();
                    };
                    s.onerror = function () {
                        dfd.resolve();
                    };
                    document.body.appendChild(s);
                } else {
                    dfd.resolve();
                }
                return dfd.promise();
            },
            mjs: function (_at, src) {
                return this.js(_at, src);
            },
            css: function (_at, href) {
                let dfd = $.Deferred();
                // APPEND CSS
                if (!foundIfLibExist(href, "link", "href")) {
                    var s = document.createElement("link");
                    s.href = href;
                    s.rel = "stylesheet";
                    s.type = "text/css";
                    s.classList.add("include-css")
                    s.onload = function () {
                        dfd.resolve();
                    };
                    s.onerror = function () {
                        dfd.resolve();
                    };
                    document.head.appendChild(s);
                } else {
                    dfd.resolve();
                }
                return dfd.promise();
            },
            com: function (_at, _r, _origin) {
                let dfd = $.Deferred();
                let _includes = typeof (_r) == "string" ? JSON.parse(_r) : _r;
                let total = _includes.length;
                let index = 0;
                if (_origin != null) {
                    if (_origin.indexOf("/") > -1) {
                        _origin = _origin.split("/");
                        _origin.pop();
                        _origin = _origin.join("/") + "/";
                    }
                } else {
                    _origin = "";
                }
                // ORDENAMOS LOS INCLUDES DEJANDO EL HTML AL FINAL, de esta forma el JS estara listo para leer el HTML.
                _includes.sort((a, b) => {
                    return a.indexOf(".html") > -1;
                });

                // ITERAMOS TODOS LOS INCLUDES INDICADOS EN EL ARCHIVO .COM
                function next() {
                    if (index < total) {
                        if (_includes[index].indexOf("./") == 0) {
                            _includes[index] = _includes[index].replace("./", _origin);
                        }

                        getSource(_at, _includes[index])
                            .then(function () {
                                index++;
                                next();
                            });
                    } else {
                        // TERMINO 
                        //console.log("RUN..1")
                        // -- Inspector.run();
                        // RESOLVEMOS
                        dfd.resolve();
                    }
                }

                // IF IS COM then is component info load. 
                next();
                return dfd.promise();
            }
        };

        function foundIfLibExist(lib, tag, prop) {
            // FIRST TRY TO FOUND IN LOCAL HASHMAP                        
            if (libs_dic_temp.hasOwnProperty(lib)) {
                return true;
            }
            let exist = false;
            let arraylibs = $(tag).toArray();
            for (let i in arraylibs) {
                if (arraylibs[i][prop].indexOf(lib) > -1) {
                    exist = true;
                    libs_dic_temp[lib] = true;
                    break;
                }
            }

            return exist;
        }

        function getSource(from, _src) {
            if (Array.isArray(_src)) {
                return callbacks.com(from, _src);
            }
            let dfd = $.Deferred();
            try {
                // REMOVING ? pARAMS POST CALL
                if (_src.indexOf("?") > 1) {
                    _src = _src.split("?");
                    _src.pop();
                    _src = _src.join("");
                }
                // if src is an array
                if (_src.indexOf(",") > -1) {
                    callbacks.com(from, _src.split(",")).then(dfd.resolve);
                } else {
                    // GET EXTENSION
                    let ext = (([].concat(_src.split("."))).pop() + "").toLowerCase();
                    if (ext.indexOf(":") > -1) {
                        ext = ext.split(":")[0];
                    }
                    if (!callbacks.hasOwnProperty(ext)) {
                        ext = "com";
                    }
                    if (ext == "js" || ext == "mjs") {
                        callbacks[ext](from, _src).then(dfd.resolve);
                    } else if (ext == "css") {
                        callbacks[ext](from, _src).then(dfd.resolve);
                    } else {
                        if (!temporal_request.hasOwnProperty(_src)) {
                            // -- console.log(" LOADING... %c" + _src, "color: green; font-size:15px;");
                            temporal_request[_src] = fetch(_src).then(function (response) {
                                return response.text();
                            });

                            //   temporal_request[_src] = $.get(_src + ");
                            temporal_request[_src].then(function (_r) {

                                delete temporal_request[_src];
                                callbacks[ext](from, _r, _src).then(dfd.resolve);
                            });
                        } else {
                            // -- console.log("CURENTLY LOADING... %c" + _src, "color: red; font-size:15px;");
                        }
                    }
                }
            } catch (e) {
                console.log("ERRR-----------------------")
                console.log(from, _src)
                console.warn(e);

            }
            return dfd.promise();
        }

        let lastTotal = -1, timeoutValidateme;
        function validateMe($of) {
            var total = $("include", $of).length;
            // -- App.toast("total:" + total + "==" + lastTotal);
            if (total > 0) {
                if (lastTotal == total) {
                    getIncludes();
                } else {
                    lastTotal = total;
                    timeoutValidateme = setTimeout(validateMe, 1000, $of);
                }
            }
        }
        function getIncludes($of) {
            {
                // VALIDAME EN UN SEGUNDO SI TODOS LOS INCLUDES SE HAN GENERADO
                lastTotal = -1;
                clearTimeout(timeoutValidateme);
                timeoutValidateme = setTimeout(validateMe, 1000, $of);
            }

            return new Promise((res, rej) => {
                let selector = $("include:not(.loading)", $of);
                let totalIncludes = selector.length;
                if (totalIncludes == 0) {
                    res();
                    run()
                } else {
                    selector.each(function () {
                        let $includeDom = this;
                        $(this).addClass("loading");
                        this.tryouts = 3;
                        this.getSource = function () {
                            this.timeoutToresolve = setTimeout(() => {
                                this.tryouts--;
                                if (this.tryouts > 0) {
                                    // --    console.log("timeout retry..")
                                    this.getSource();
                                }
                            }, 1000);
                            getSource(this, $(this).attr("src")).then(() => {
                                clearTimeout(this.timeoutToresolve);
                                $(this).removeClass("loading");
                                // -- console.log("INCLUDE THIS:", this.attributes.src.value)
                                totalIncludes--;
                                if (totalIncludes == 0) {

                                    Inspector.run();
                                    res();
                                    $includeDom.remove();
                                }
                            });
                        }
                        this.getSource();
                    });
                }

            });
        }
        return {
            clear: function () {
                libs_dic_temp = {}
            },
            getIncludes: getIncludes,
            get: getSource,
            foundIfLibExist: foundIfLibExist
        }
    }
    // ESTE METODO ES USADO PARA LLAMAR ASYN EL REFRFESCO DE TODOS LOS COMOPNTENTS
    function callToRefreshView() {
        clearTimeout(timeOutToRefreshPostComponents);
        timeOutToRefreshPostComponents = setTimeout(refreshViewPostComponent, 100);
    }
    // ESTE METODO REVISA TODO LOS COMPONENTES Y SI ESTAN TODOS LISTOS LOS MANDA A ACTUALZIAR
    var renderingAll = false;
    function refreshViewPostComponent() {
        // INDICAMOS QUE ACTUELICE la vista
        if (!renderingAll) {

            renderingAll = true;
            for (let i in Inspector.Components.binds) {
                let ready = Inspector.Components.render(Inspector.Components.binds[i].$el);
                //SI ALGUNO NO ESTA LISTO LLAMA PARA ACTUALIZAR LA VISTA
                if (!ready) {
                    // SI NO A SIDO ELIMINADO
                    if (Inspector.Components.binds[i] != null && Inspector.Components.binds[i].$el != null) {
                        // SI ESTA CONECTADO REINTENTA
                        if (Inspector.Components.binds[i].$el.get(0).isConnected) {
                            callToRefreshView();
                            break;
                        }
                    }
                }
            }
            setTimeout(() => {
                renderingAll = false;
            });
        }
    }

    // ESTE ES UNA CLASE QUE CREA UN OBSERVADOR DE PROPIEDADES.
    function ComponentWatcher($el, instanceName, className, fnclass) {
        let _this = this;
        this.$el = $el;
        this.$watchers = {};
        $el.get(0).$dirty = true;
        var ticksCallback = [];
        // METODO QUE LLAMA CUANDO UN VALOR SE HA MODIFICADO EN CUALQUIER OBJETO Y LANZA UN EVENTO QUE FUNCIONE COMO UN CALL
        function dispatch_tickUpdate(instance, prop, a) {
            setTimeout(() => {
                //console.log("--------------------DISPATCH TICK UPDATE-------------------", prop, a);
                for (let i in ticksCallback) {
                    ticksCallback[i].callback(instance, prop, a);
                }
            });
        }
        $el.get(0).$handler = $el;
        $el.get(0).$ComWatchers = $el.get(0).$ComWatchers || {};
        $el.get(0).$ComWatchers[className] = this;
        $el.get(0).instanceName = instanceName;
        this.getExpressions = function () {
            return $el.get(0).Inspector.getExpressions();
        }
        // ADICIONA EL HTML DENTRO DEL MISMO Y REMPLAZA LOS THIS POR EL INSTANCE CORRESPONDEINDE DEL OBJETO
        $el.setHtml = etHtml = $el.setHTML = (html) => {
            $el.html(html);
            $el.get(0).Inspector.replaceThisWithMyInstanceName();
        };

        $el.$onAllIncludesload = $el.get(0).onAllIncludesload = function (_callback) {
            $el.$callback_onAllIncludesload = _callback;
            if ($("include", $el).length == 0) {
                _callback();
            }
        };
        // VALIDA: SI DENTRO HAY INCLUDES, ENTONCES EPSERAQUE TERMINEN
        if ($("include", $el).length > 0) {
            (() => {
                let _end = false;
                let $parent = $("include", $el).parent();
                let timeoutToTimeout = null, interavalDomChange = null;
                function callbackOnChangeDom() {
                    // CUANDO YA NO HAY INCLUDES  

                    if ($("include", $parent).length == 0 && !_end) {
                        // QUITA ESTE EVENTO DE ESCUCHA ADEMAS USO LA VARIABLE END POR SI LA ASINCRONIA HACE QUE E ESCAPE UN EVENTO MAS
                        _end = true;
                        clearInterval(interavalDomChange);
                        // Y HAS UN TIMEOUT INSPECCIONAR LOS ELEMENTOS
                        clearTimeout(timeoutToTimeout);
                        timeoutToTimeout = setTimeout(() => {
                            if ($el.$callback_onAllIncludesload != null) {
                                $el.$callback_onAllIncludesload();
                            }
                            $el.get(0).Inspector.replaceThisWithMyInstanceName();
                        }, 30);
                    }

                };
                interavalDomChange = setInterval(callbackOnChangeDom, 10);
            })();
        }

        // INYECTA  METODOS PARA QUE RENDERIZE
        $el.$update = $el.$apply = $el.$render = function () {
            _this.$el.get(0).$dirty = true;
            _this.onCallToRender();
        };
        // INYECTA UN WATCHER EXTERNO 
        $el.$watch = function (prop, fncallback) {
            _this.$watchers[prop] = fncallback;
            return function unbind() {
                _this.$watchers[prop] = null;
                delete _this.$watchers[prop];
            }
        };
        // CUANDO QUIERE QUE SE LE NOTIFIQUE CUANDO HAYA UN TICK UPDATE
        $el.$onTick = function (_callback) {
            ticksCallback.push({ instance: this, $el: $el, callback: _callback });
        };
        // PARA EVALUAR EL SCOPE
        $el.$eval = function (_expresion) {
            let $scope = getComponentScope();
            let totalComponents = Object.keys($scope);
            let evaluated_ex_result = null;
            if (totalComponents.length > 0) {
                // ELEMENT THIS FOR SCOPE
                let $element = $el;
                with ($scope) {
                    try {
                        evaluated_ex_result = eval(_expresion);
                    } catch (e) {
                        if (Inspector.DEV) {
                            console.warn("Can parse inspection on eval:" + _expresion, $event);
                            console.warn(e);
                        }
                    }
                }
            }
            return evaluated_ex_result;
        };
        $el.get(0).Inspector.replaceThisWithMyInstanceName();
        this.instance = new fnclass($el);
        // CREA UN METODO QUE SERA SOBREESCRITO POR FUERA
        this.onCallToRender = function () {
            //--OVERRIDER ON CALL TO RENDER.
        };
        // APLICA LOS METODOS MISMOS A LA INSTANCIA
        this.instance.$apply = this.instance.$update = this.instance.$render = $el.$apply;
        this.instance.$watch = $el.$watch;
        this.instance.$eval = $el.$eval;
        this.instance.$onTick = $el.$onTick;
        this.instance.$instanceName = instanceName;
        this.instance.$getIncludes = function () {
            $.Inspector.Includer.getIncludes();
        }
        // INYECTA UN SET PARA DEFINIR VALORES
        this.instance.set = function (prop, value) {
            if (this[prop] != value) {
                this[prop] = value;
            }
        };
        // CUANDO HAY UN CAMBIO EN ALGUNA PROPIEDAD DEL OBJETO.
        function on_dispatch_tickupdate(_obj, prop, _v) {
            $el.get(0).$dirty = true;
            dispatch_tickUpdate(_obj, prop, _v);

        }
        // ITERA LAS PROPIEDADES DE LA INSTANCIA
        setTimeout(() => {
            AddPropertiesEvaluator(this.instance, "");
        });
        function AddPropertiesEvaluator(_obj, _parentTree) {
            if (_obj == null || typeof (_obj) != "object") {
                return;
            }
            let properties = {};
            Object.keys(_obj).forEach(function (prop, _indexProperty) {
                // MIENTRAS QUE ESTA PROPIEADAD NO SEA UNA FUNCION
                if (typeof (_obj[prop]) != "function") {
                    // INSTANCIA LA PROPIEDAD
                    properties[prop] = _obj[prop];
                    // SI LA PROPIEDAD ES UNA ARRAY SOBREESCRIBE LAS OPERACIOENS DE ARRAY, PARA ACTUALIZAR
                    if (Array.isArray(_obj[prop])) {
                        ['pop', 'push', 'reverse', 'shift', 'unshift', 'splice', 'sort'].forEach((m) => {
                            _obj[prop][m] = function () {
                                var res = Array.prototype[m].apply(_obj[prop], arguments); // call normal behaviour                            
                                _this.instance.$apply();
                                return res;
                            }
                        });
                    }
                    // DEFINA LOS SETS DE LA PROPIEDAD LLAMAR A ACTUALIZAR
                    Object.defineProperty(_obj, prop, {
                        // INDICA SI ES ENUMERABLE SI ESTE ES UN ARRAY.
                        enumerable: Array.isArray(_obj[prop]),
                        // DEFINE EL SET
                        set: function (_v) {
                            if (_this.instance != null) {
                                // SI HAY UN CAMBIO
                                if (properties[prop] != _v) {
                                    on_dispatch_tickupdate(_obj, prop, _v);
                                    // VALIDA LOS WATCHES E INDICA CUAL CAMBIO
                                    if (_this.$watchers.hasOwnProperty(_parentTree + prop)) {
                                        _this.$watchers[_parentTree + prop](_v);
                                    }
                                    // SI ES UN OBJECto TOCA REEVALUAR LAS PROPIEDADES YA QUE HA CAMBIADO...
                                    if (typeof (_obj[prop]) == "object") {
                                        // --   setTimeout(() => { AddPropertiesEvaluator(_obj[prop], _parentTree + prop + "."); })
                                    }
                                }

                                // DALE VALOR A LA PROPIEDAD.
                                properties[prop] = _v;
                                // dile que actualice

                                _this.instance.$apply();
                            }
                        },
                        // DEFINE GET
                        get: function () {
                            // DALE RESPEUSTA ENEL ARBOLD E PROPIEDADES
                            return properties[prop];
                        }
                    });
                    // AHORA SI LA PROPIEDAD ES UN DICCIONARIO/HASH/OBJECT
                    if (typeof (_obj[prop]) == "object") {
                        // -- AddPropertiesEvaluator(_obj[prop], _parentTree + prop + ".");
                    }
                }
            });
        }

        this.delete = function () {
            delete this.instance;
            $el = null;
            delete $el;
            delete this;
        };
    };
    // ESTE METODO ES UN HELPER PARA OBNTENER LOS COMPONENTES ANIDADOS.
    function getComponents() {
        return Inspector.Components.binds;
    }
    // ESTE METODO ALMACENA EL SCOPE(AMBITO) DE USO EN EL HTML
    function storeScope(_$newScope) {
        $innerScope = _$newScope;
    }
    // ESTE METODO OBTIENE Y LLENA EL SCOPE(AMBITO) CON LOS COMPONENTES
    function getComponentScope() {
        // ESTE METODO TRAE TODOS LOS COMPONENTES
        let clist = getComponents();
        for (let key in clist) {
            if (key.indexOf(" as ") > -1) {
                $innerScope[key.split(" as ")[1]] = clist[key].instance
            } else {
                $innerScope[key] = clist[key].instance
            }
        }
        return $innerScope;
    }
    // UTIL FUNCTION TO GET SET DESC PROPERTY PATH
    function setDescendantProp(obj, desc, value) {
        var arr = desc.split(".");
        while (arr.length > 1) {
            obj = obj[arr.shift()];
        }
        obj[arr[0]] = value;
    }
    // UTIL FUNCTION TO GET SET DESC PROPERTY PATH
    function getDescendantProp(obj, desc) {
        var arr = desc.split(".");
        while (arr.length > 1) {
            obj = obj[arr.shift()];
        }
        return obj[arr[0]];
    }
    /* ESTE METODO INSPECCIONA EL DOM PARA RECONOCER LOS ATRIBUTOS/PROPIEDADES QUE SE DEBEN INSPECCIONAR PARA
        PARA EVALUAR Y ESCRIBIR EN EL MISMO.
    */
    var _COUNT_INSPECTS = 0;
    function initDomInspector(elements, attrselector) {
        let dfd = $.Deferred();
        elements = elements || "[inspect]";
        // DOM INSPECTORS...
        let total = $(elements).length;
        let ready = 0;
        // INDICA QUE ESTA LISTO Y HA TERMINADO
        function onReady() {
            ready++;
            if (ready >= total) {
                dfd.resolve();
            }
        }
        // ESTE METODO EVALUA EL EVENTO QUE SUCEDE EN LA VISTA.
        function evaluateEvent(_expresion, $event) {
            if (_expresion.length == 0 || _expresion.indexOf("this.") > -1) {
                return null;
            }
            //  console.log("evaluateEvent",_expresion,$event.type)         
            let $scope = getComponentScope();
            let totalComponents = Object.keys($scope);
            let evaluated_ex_result = null;
            // ELEMENT THIS FOR SCOPE
            let $element = this;

            if (totalComponents.length > 0) {
                with ($scope) {
                    try {
                        evaluated_ex_result = eval(_expresion);
                    } catch (e) {
                        if (Inspector.DEV) {
                            console.warn("Can parse inspection on:" + _expresion, $event);
                            console.warn(e);
                        }
                    }
                }
                // - refreshViewPostComponent();
                // save scope
                storeScope($scope);
            }
            return evaluated_ex_result;
        }
        // ITERA EL ELEMENTO QUE TIENE EL COMPONENTE.
        $(elements).each(
            function IterateEachElementOnInspector() {
                // SOLO ITERA SI ESTE DOM TIENE LINKEADO UN INSPECTOR.
                if (this.Inspector == null) {
                    // CREA UNA VARIABLE PARA GUARDAR ESTE AMBITO
                    var $this = this;
                    // CREA UNA VARIABLE QUE ALMACENA EL ID DE TIMEOUT PARA NO RENDERIZAR VARIAS VECES EN EL MISMO TIEMPO.   
                    var timeoutTorender = null;
                    //
                    var resolveDfd = null;
                    // INICIALIZA EL INSPECTOR 
                    _COUNT_INSPECTS++;
                    this.setAttribute("DOM-INSPECT-" + _COUNT_INSPECTS, "");
                    this.Inspector = {
                        // VARIABLE QUE INDICA SI ESTA RENDERIZANDO LA VISTA
                        rendering: false,
                        instanceName: this.attributes.com.value.toLowerCase(),
                        // OBTEN EL COMPONENTE (NOMBRE)
                        component: function () {
                            return $this.attributes[attrselector].value;
                        },

                        // INSPECCIONA EL ELEMENTO PARA VER SI HAY NUEVAS EXPRESIONES POR VALIDAR
                        inspect: function () {
                            inspectNode($this);
                        },
                        // ESTE METODO OBTIENE LAS EXPRESSIONES DE LOS ELEMENTOS
                        getExpressions: function () {
                            return attributesToUpdate;
                        },
                        // ESTE METODO ACTUALIZA LA VISTA LLAMANDO A SER RENDERIZADO
                        update: function () {
                            // USA UN TIMEOUT DE UN MILISEGUNDO PARA QUE PASE A LA SIGUIENTE COLA DE EJECUCION Y ASI APILAR LOS LLAMADOS A SOLO 1.
                            clearTimeout(timeoutTorender);
                            return new Promise((resolve, reject) => {
                                resolveDfd = {
                                    resolve: resolve,
                                    reject: reject
                                };
                                timeoutTorender = setTimeout(render, 1);
                            });
                        },
                        replaceThisWithMyInstanceName: function () {
                            // --   $el.html($el.html().split("this.").join(instanceName + "."));
                            let expressions = this.getExpressions();
                            for (let i = expressions.length - 1; i > -1; i--) {
                                replaceExpressionThisWithInstaceName(expressions[i]);
                            }
                            this.inspect();
                        }
                    };

                    var replaceThisWithInstance = function (exp) {
                        try {
                            exp = exp.split("this.").join($this.instanceName + ".");
                        } catch (e) {
                            console.log(e);
                        }

                        return exp;
                    }

                    var replaceExpressionThisWithInstaceName = function (expression) {
                        if ($this.hasOwnProperty("instanceName") && $this.instanceName != "this") {
                            for (let j = expression.expressions.length - 1; j > -1; j--) {
                                let ex = expression.expressions[j];
                                if (ex.indexOf("this.") > -1) {
                                    if (expression.dom.nodeName == "#text") {
                                        expression.dom.textContent = replaceThisWithInstance(expression.dom.textContent);
                                    } else {

                                        for (let _a = expression.dom.attributes.length - 1; _a > -1; _a--) {

                                            expression.dom.attributes[_a].value = replaceThisWithInstance(expression.dom.attributes[_a].value);


                                        }
                                    }
                                    expression.expressions[j] = replaceThisWithInstance(ex);

                                }
                            }
                        }
                        return expression;
                    }
                    // CREA UNA VARIABLE PARA MEJOR ACCESO EN ESTE AMBITO
                    var _thisInspector = this.Inspector;
                    // CREA ARRAY DE ATRIBUTOS QUE GUARDARAN LAS EXPRESIONES A EVALUAR Y RENDERIZAR.        
                    var attributesToUpdate = [];
                    // DEFINE VARIABLE QUE GUARDA EL ID DE EJECUCION PARA UNTIMEOUT PARA INDICAR QUE HA TERMINADO Y ESTA LISTO.
                    var timeoutToCallReady = null;

                    var compName = function () {
                        return $this.attributes.com.value;
                    }
                    // -- console.log("compName", compName());
                    // INSPECCIONA EL NODO ACTUAL
                    inspectNode(this);
                    /*
                        ESTE METODO RECORRE SUS ATRIBUTOS Y EL ATRIBUTO DE SUS HIJOS DEL ELEMENTO INDICADO 
                        PARA DEFINIR LAS EXPRESSIONES PARA EVALUAR.
                     */
                    function inspectNode(_el) {

                        // SI EL ELEMENTO TIENE ATRIBUTOS
                        if (_el.attributes != null) {
                            // SI EL ELEMENTO TIENE un ATRIBUTO COM omitelo
                            if (_el.attributes.hasOwnProperty("com")) {
                                // --  console.log("validate", _el.attributes.com.value, "==", compName(), _el.attributes.com.value == compName());
                                if (_el.attributes.com.value != compName()) {
                                    return;
                                }
                            }
                            // VALIDA SI TIENE ATRIBUTOS DE MODELO
                            // --  SI EXISTE DEBE SER EL PRIMERO EN CORRER
                            if (_el.attributes.hasOwnProperty("model")) {
                                // SI EL MODELO YA HA SIDO INSTANCIADO NO LO REINSTANCIES.                            
                                if (!_el.modelTriggerInitiated) {
                                    _el.modelTriggerInitiated = true;
                                    // GUARDA TEMPORALMENTE LAS EJECUCIONES QUE PUEDAN TENER EN onkeyup Y onchange.
                                    let events = ["onkeydown", "onkeyup", "onchange"];
                                    let temps = {};
                                    for (let i in events) {
                                        let _evt = events[i];
                                        temps[_evt] = "" + (_el.attributes.hasOwnProperty(_evt) ? _el.attributes[_evt].value : "");
                                    }

                                    // SOBRE ESCRIBE LOS METODOS DE ONKEYUP Y ONCHANGE PARA QUE EJECUTEN EL TRIGGER 
                                    _el.onkeyup = modelTrigger;
                                    _el.onkeydown = modelTrigger;
                                    _el.onchange = modelTrigger;
                                    /* 
                                        AGREGA LA EXPRESION A EVALUAR INDICADA EN EL ATRIBUTO MODEL,
                                        ESTO HARA QUE EL VALUE TOME EL VALOR DEL MODELO ASIGNADO,
                                        PERO: SI ES UN RADIO, CHECK O BUTTON El valor no debe ser asignado a estos sino que estos mas bien
                                        asignaran valor al modelo.

                                    */
                                    if (_el.type != "radio" && _el.type != "checkbox" && _el.type != "button") {
                                        let expresion = validate(_el, "value", "{{" + _el.attributes.model.value + "}}");
                                        addAttributeToUpdate(expresion);
                                        if (_el.value != null && _el.value != "") {
                                            setTimeout(() => {

                                                evaluateEvent.call(_el,
                                                    replaceThisWithInstance(_el.attributes.model.value) + "=$event.target.value",
                                                    {
                                                        target: _el
                                                    });
                                            });
                                        }
                                    } else if (_el.type == "radio") {
                                        let expresion = validate(_el, "checked", "{{$element.value==" + _el.attributes.model.value + "?'checked':''}}");
                                        addAttributeToUpdate(expresion);
                                    } else if (_el.type == "checkbox") {
                                        let expresion = validate(_el, "checked", "{{" + _el.attributes.model.value + ".indexOf($element.value)>-1?'checked':''}}");
                                        addAttributeToUpdate(expresion);
                                    }


                                    /*
                                        ESTE METODO ES UN TRIGGER LLAMADO POSTERIOR A onkeyup || onchange.
                                    */
                                    function modelTrigger(evt) {
                                        /* PRIMERO EVALUA LA EXPRESION DEL MODELO. USANDO EL METODO evaluateEvent.
                                            ESTO HARA QUE EL MODELO RECIVA EL VALOR DEL ELEMENTO
                                        */
                                        if (_el.type == "checkbox") {
                                            if (_el.checked) {
                                                evaluateEvent.call(_el, replaceThisWithInstance(_el.attributes.model.value) + ".push($event.target.value)", evt);
                                            } else {
                                                let v = replaceThisWithInstance(_el.attributes.model.value);
                                                evaluateEvent.call(_el, v + ".splice(" + v + ".indexOf($event.target.value),1)", evt);
                                            }
                                        } else {
                                            setTimeout(() => {
                                                evaluateEvent.call(_el, replaceThisWithInstance(_el.attributes.model.value) + "=$event.target.value", evt);
                                            })
                                        }
                                        // NEXT EJECUTA POSTERIOR MENTE LOS LLAMADOS DE onchange O onkeyup SI ESTOS EXISTEN
                                        try {
                                            // SI TIENE ONCHANGE LLAMALO
                                            if (evt.type = "change" && temps.onchange != null) {
                                                evaluateEvent.call(_el, replaceThisWithInstance(temps.onchange), evt);
                                            } else if (evt.type = "keydown" && temps.onkeydown != null) {
                                                // SI TIENE ONKEYUP LLAMALO.
                                                evaluateEvent.call(_el, replaceThisWithInstance(temps.onkeydown), evt);
                                            } else if (evt.type = "keyup" && temps.onkeyup != null) {
                                                // SI TIENE ONKEYUP LLAMALO.
                                                evaluateEvent.call(_el, replaceThisWithInstance(temps.onkeyup), evt);
                                            }
                                        } catch (e) {
                                            // ESTA EJECUCION PUEDE FALLAR.
                                            if (Inspector.DEV) {
                                                console.warn(e, _el);
                                            }
                                        }

                                    };
                                }
                            }
                            // LUEGO ITERA LOS DEMAS ATRIBUTOS, PARA VALIDAR EXPRESIONES.
                            for (let i = _el.attributes.length - 1; i >= 0; i--) {
                                // GUARDAMOS EL ATTR PARA MEJOR MANEJO EN EL AMBITO ACTUAL.
                                let attr = _el.attributes[i];
                                // SI EL USUARIO HA IMPLEMTANDO ALGUN EVENTO
                                if (USER_EVENTS.indexOf(attr.name) > -1) {
                                    // OBTEN EL NOMBRE DEL EVENTO A USAR.
                                    let eventname = USER_EVENTS[USER_EVENTS.indexOf(attr.name)];
                                    /*
                                     SI EL NOMBRE DEL EVENTO ES USADO A LA PAR DEL MODELO ENTONCES
                                     NO LO EVALUES.
                                        - SI HAY MODELO NO USAR ONKEYUP, NI ONCHANGE AQUI.
                                     */
                                    if (!((eventname == "onkeydown" || eventname == "onkeyup" || eventname == "onchange") &&
                                        _el.attributes.hasOwnProperty("model"))) {


                                        _el[eventname] = function (evt) {

                                            var exp = replaceThisWithInstance(attr.value);

                                            return evaluateEvent.call(_el, exp, evt);
                                        };

                                        // VALIDAR onclick con ontouch
                                        if (eventname == "onclick") {
                                            _el.ontouch = _el[eventname];
                                        }
                                    }

                                } else if (attr.name == "show" || attr.name == "hide") {
                                    let expresion = validate(_el, attr.name, attr.value.indexOf("{{") == -1 ? "{{" + attr.value + "}}" : attr.value);
                                    if (expresion != null) {
                                        addAttributeToUpdate(expresion);
                                    }
                                } else if (attr.name == "repeat") {
                                    // SI ES UNA REPETICION DEBERIA SOLO TENER UNA EXPRESSION VALIDA, SI TIENEN MAS SE OMITIRAN.
                                    let actors = attr.value.trim().split(" IN ").join(" in ").toLowerCase().split(" in ");
                                    // actors[0] = object instance of array
                                    // actors[1] = array of function of iteration. 
                                    // add one iteration fnc.
                                    $Iterations.total++;
                                    // get one iteration id
                                    let id_iteration = $Iterations.total;
                                    /* HTML DONDE DEJAMOS LO QUE SE DEBE COMPILAR */
                                    let _html = "$Iterations[" + id_iteration + "].iteration(" + actors[1] + ")";
                                    // REMOVMEMOS EL ATRIBUTO DE REPETICION
                                    _el.removeAttribute("repeat");
                                    // AGREGAMOS EL ATRIBUTO DE INSTANCIA
                                    $(_el).attr("instance", "{{$scope." + actors[0] + "=$Iterations[" + id_iteration + "].get($index);$index;}}");
                                    let templateDom = _el.outerHTML;
                                    // CREAMOS UN CONTENEDOR
                                    $("<repeat html='" + _html + "'></repeat>").insertAfter(_el);
                                    let repeatEl = $(_el).next("repeat").get(0);
                                    // ELIMINAMOS ORIGINAL
                                    _el.remove();
                                    //templateDom=templateDom.split(actors[0]).join("$Iterations["+id_iteration+"].get($index)");
                                    let once = true;
                                    let $array = [],
                                        $array_total = 0;
                                    $Iterations[id_iteration] = {
                                        get: function ($index) {
                                            if ($index < $array_total) {
                                                return $array[$index];
                                            } else {
                                                return "";
                                            }
                                        },
                                        iteration: function (_array) {
                                            $array = _array;
                                            $array_total = _array.length;
                                            return "" + ($array.map(function (a, $index) {
                                                return templateDom.split("$index").join($index);
                                            }).join(""));
                                        }
                                    };
                                    // EVALUAMOS LA EXPRESSION
                                    let expresion = validate(repeatEl, "innerHTML", _html);
                                    if (expresion != null) {
                                        addAttributeToUpdate(expresion);
                                    }
                                } else if (attr.name == "html") {
                                    let expresion = validate(_el, "innerHTML", attr.value);
                                    if (expresion != null) {
                                        addAttributeToUpdate(expresion);
                                    }
                                    //  _el.removeAttribute("html");
                                } else {
                                    // DETECT EXPRESSION
                                    let expresion = validate(_el, "attributes." + attr.name, attr.value);
                                    if (expresion != null) {
                                        addAttributeToUpdate(expresion);
                                    }
                                }
                            }
                        } else if (_el.nodeName == "#text") {
                            // SI NO TIENE ATRIBUTOS Y ES UN TEXTO VALIDA EL TEXTCONTEN DE ESTE NODO.
                            let expresion = validate(_el, "textContent", _el.textContent);
                            // SI HAY UNA EXPRESION EN SU CONTENIDO, AGREGALO AL ARRAY DE ATTRIBUTOS
                            if (expresion != null) {
                                addAttributeToUpdate(expresion);
                            }
                        }
                        // VALIDA SI NO TIENE HIJOS ESTE NODO PARA LLAMAR ON READY
                        if (validateIfChildsOfNode(_el) == 0) {
                            clearTimeout(timeoutToCallReady);
                            timeoutToCallReady = setTimeout(onReady, 100);
                        }
                    }
                    /*
                        SUBMETODO APRA VALIDAR LOS HIJOS DE UN NODO, USADO POR INSPECTNODE
                    */
                    function validateIfChildsOfNode(_el) {
                        var c = _el.childNodes;
                        let total = c.length;
                        for (let i = 0; i < total; i++) {
                            inspectNode(c[i]);
                        }
                        return total;
                    }
                    /*
                        ESTE METODO AGREGA ATRIBUTOS PARA ACTUALIZAR.
                    */
                    function addAttributeToUpdate(expresion) {
                        expresion = replaceExpressionThisWithInstaceName(expresion);
                        // VALIDATE IF DOM, NAME AND EXPRESSION EXIST
                        let exist = false;
                        for (let i in attributesToUpdate) {
                            if (expresion.dom == attributesToUpdate[i].dom &&
                                expresion.name == attributesToUpdate[i].name &&
                                expresion.expressions.join("<->") == attributesToUpdate[i].expressions.join("<->")
                            ) {
                                exist = true;
                                break;
                            }
                        }
                        // DONT ADD IF ALLREADY EXIST
                        if (!exist) {
                            // replace this with insanceName

                            attributesToUpdate.push(expresion);
                        }
                    }
                    /*
                     ESTE METODO VALIDA QUE LA PROPIEDAD O ATTRIBUTO PUEDA CONTENER ELEMENTOS
                    */
                    function validate(_el, prop_name, value) {
                        value = value || "";
                        // VALIDA SI ESTE ELEMENTO TIENE ELEMENTOS INYECTABLES
                        if (prop_name.toLowerCase().indexOf("innerhtml") > -1) {
                            // IF NOT HAS {{}} PUT IN ON
                            if (value.indexOf("{{") == -1 && value.indexOf("}}") == -1) {
                                value = "{{" + value + "}}";
                            }
                        }
                        let indexes = [value.indexOf("{{"), value.indexOf("}}")];
                        if (indexes.length > 0) {
                            if (indexes[0] > -1 && indexes[1] > -1) {
                                let value_str = value;
                                let vlength = value_str.length;
                                let expressions = [];
                                let broke = false;
                                while (indexes[0] > -1 && indexes[1] > -1) {
                                    try {
                                        if ((indexes[0] + 2 < indexes[1]) && vlength > indexes[0] + 2 && vlength > indexes[1]) {
                                            expressions.push(value_str.substring(indexes[0] + 2, indexes[1]));
                                            value_str = value_str.substr(0, indexes[0]) + "-$ex" + expressions.length + "$-" + value_str.substr(indexes[1] + 2, value_str.length);
                                            indexes = [value_str.indexOf("{{"), value_str.indexOf("}}")];
                                        } else {

                                            console.log("%c INSPECTOR CANT EVAUATE THIS:", "color:#9e9d24 ;font-size:14px;");
                                            console.log(value_str);
                                            broke = true;
                                            break;
                                        }
                                    } catch (e) {
                                        console.error(e);
                                        broke = true;
                                        break;
                                    }
                                }
                                if (broke) {
                                    return null;
                                }
                                return {
                                    dom: _el,
                                    name: prop_name,
                                    value: value_str,
                                    expressions: expressions
                                };
                            }
                        } else {
                            console.log("$cERROR EVALUATING..", "color:red;font-size:12px")
                        }
                        return null;
                    }
                    // ESTE METODO ACTUALIZA EL HTML
                    function render() {

                        if (_thisInspector.rendering == true) {
                            return;
                        }

                        _thisInspector.rendering = true;
                        let $scope = getComponentScope();
                        let totalComponents = Object.keys($scope);
                        let temp = [];
                        let rerender = false;
                        let totalAttributesToUpdate = attributesToUpdate.length;

                        var iterationToRender = function (attr, i) {

                            let $element = attr.dom;
                            // si el $element esta conectado continuamos sino lo sacamos
                            //console.log($element,$element.isConnected);
                            if ($element.isConnected) {
                                // GUARDAMOS EN U TEMPORAL 
                                temp.push(attr);

                                if (!attr.exec) {
                                    let expressions = attr.expressions;
                                    // 
                                    attr.fncs = new Array(expressions.length);
                                    attr.str_fnc = "" + attr.value;
                                    attr.exec_fnc = function () {
                                        try {
                                            return eval("`" + this.str_fnc + "`");
                                        } catch (e) {
                                            console.log("-------------------------");
                                            console.error(e);
                                            console.log(this.str_fnc);
                                            console.log($element);
                                            console.log("-------------------------");
                                        }
                                        return "";

                                    }
                                    // SI NO ES: ITERA LAS EXPRESSIONES DENTRO                                
                                    for (let j = expressions.length - 1; j >= 0; j--) {
                                        let mark = "-$ex" + (j + 1) + "$-";
                                        // SCOPEINSTANCE
                                        with ($scope) {
                                            if (attr.fncs[j] == null) {
                                                // DEFINITY 
                                                let ex = expressions[j];
                                                let fnc = `()=> { let evaluated_ex ='';try{ if (totalComponents.length > 0) {  evaluated_ex =(${ex});if (evaluated_ex == undefined) {evaluated_ex = "";}if ((evaluated_ex).toString() == "[object Object]") {evaluated_ex = JSON.stringify(evaluated_ex);}} else {evaluated_ex=''; }}catch(e){  if (Inspector.DEV) {console.warn(e);}}return evaluated_ex;};`;
                                                // SCOPEINSTANCE
                                                with ($scope) {
                                                    try {
                                                        attr.fncs[j] = eval(fnc);
                                                    } catch (e) {
                                                        console.log("%cerror----------------", "color:red;font-size:20px");
                                                        console.log(e);
                                                        console.log(ex);
                                                        // -- console.log(fnc);
                                                        console.log("%c-------------------------------->", "color:red;font-size:20px");
                                                    }
                                                }
                                            }
                                            attr.str_fnc = attr.str_fnc.replace(mark, '${attr.fncs[' + j + ']()}');
                                        }
                                    }
                                    // EXECUTE THE RENDER EVALUATE
                                    attr.exec = function () {
                                        let str_value = attr.exec_fnc();
                                        // VALIDATE IF THE ATTRIBUTE OF UPDATE IS NOT THE SAME VALUE
                                        let updated = false;
                                        // UPDATE            
                                        if (attr.name == "innerHTML") {
                                            // FIRST REMOVE ALL ' (SINGLE )
                                            // -- str_value = (str_value || "").split("'").join('"');
                                            // VALIDATE IF NOT SAME
                                            if ($element.lastHTML == null || $element.lastHTML.trim() != str_value.trim()) {
                                                updated = "innerHTML";
                                                // console.log("rewrite HTML", $element.nodeName);
                                                // RE WRITE HTML
                                                $element.lastHTML = str_value.trim();
                                                $($element).html(str_value);
                                                if ($element.nodeName == "REPEAT") {
                                                    // WITH REPEAT THERE IS NEEDED SOME TIME TO VALIDATE CONNECTED CHILDS
                                                    setTimeout(function () {
                                                        // VALIDATE IF THERE IS CHILDS TO RENDER   BY FORCE                                        
                                                        if (validateIfChildsOfNode($element) > 0) {
                                                            _thisInspector.update();
                                                        }
                                                    }, 1);
                                                }
                                                // VALIDATE IF THERE IS IMPORTS 
                                                if ($("include:not(.loading)", $element).length > 0) {
                                                    Inspector.Includer.getIncludes();
                                                    validateIfChildsOfNode($element);
                                                    rerender = true;
                                                }
                                                // REPLACE THIS WITH INSTANCENAME

                                                _thisInspector.replaceThisWithMyInstanceName();

                                            }
                                        } else if (attr.name == "attributes.class") {
                                            // VALIDATE IF NEED TO BE UPDATED
                                            if ($($element).attr("class") != str_value) {
                                                updated = "class";
                                                $($element).attr("class", str_value);
                                            }
                                        } else if (attr.name.indexOf("attributes") > -1) {
                                            let attr_name = attr.name.split("attributes.")[1];
                                            // VALIDATE IF NEED TO BE UPDATED ENTER ALL ATTRIBUTES LIKE VALUE AND STYLE
                                            if ($($element).attr(attr_name) != str_value) {
                                                /**
                                                 *  IF IS DIFFERENT OVERWRITE, BUT VALIDATE IF IS AND INPUT ON FOCUS                                         * 
                                                  */
                                                if (!$($element).is("input:focus")) {
                                                    updated = attr_name;
                                                    $($element).attr(attr_name, str_value);

                                                }
                                            }
                                        } else if (attr.name.indexOf("textContent") > -1) {
                                            // VALIDATE IF NEED TO BE UPDATED
                                            if ($element.textContent != str_value) {
                                                updated = "textContent"
                                                $element.textContent = str_value;
                                            }
                                        } else {
                                            // VALIDATE IF NEED TO BE UPDATED                                
                                            let attr_value = getDescendantProp($element, attr.name);
                                            if (attr_value != str_value) {
                                                updated = attr.name
                                                setDescendantProp($element, attr.name, str_value);
                                                // SI EL ATTRIBUTO SE ACTUALIZA Y ES UN SHOW
                                                if (attr.name == "show") {
                                                    if (str_value.trim() == "false") {
                                                        $($element).hide();
                                                    } else {
                                                        $($element).show();
                                                    }
                                                } else if (attr.name == "hide") {
                                                    if (str_value.trim() == "false") {
                                                        $($element).show();
                                                    } else {
                                                        $($element).hide();
                                                    }
                                                }
                                            }
                                        }
                                        Inspector.cicles++
                                        if (Inspector.cicles > 999999) {
                                            Inspector.cicles = 1;
                                        }
                                        if (updated && Inspector.DEV) {
                                            // -- console.log(Inspector.cicles)
                                            console.log("now updated node view", updated, $element)
                                        }
                                    }
                                }
                                attr.exec();
                            }

                            onEndRender();
                        };
                        // --console.log(attributesToUpdate);
                        // iteramos atributos para su actualizacion
                        let iterations = 0,
                            totalIterations = attributesToUpdate.length;
                        //console.log("---RENDER NOW ("+totalIterations+")--", $this)
                        //attributesToUpdate.forEach(iterationToRender);

                        for (let _i = 0; _i < totalAttributesToUpdate; _i++) {
                            iterationToRender(attributesToUpdate[_i], _i);
                        }

                        if (totalAttributesToUpdate == 0) {
                            onEndRender();
                        }

                        function onEndRender() {
                            iterations++;
                            if (iterations >= totalIterations) {
                                // REESCRIBIMOS EL ARRAY POR SI NO HAY DOM CONECTADO
                                attributesToUpdate = [].concat(temp);
                                // RE RENDER
                                if (rerender) {
                                    render();
                                } else {
                                    // ENDING
                                    if (resolveDfd != null) {
                                        resolveDfd.resolve();
                                    }
                                }
                                storeScope($scope);
                                _thisInspector.rendering = false;
                            }
                        }
                    }
                    // __ END RENDERING __ 
                    if (!owner.counter) {
                        owner.counter = 0;
                    }
                    owner.counter++;
                    //console.log("INSTANCING FUNCTIONS " + owner.counter);
                }
            });
        return dfd.promise();
    }
})(window);