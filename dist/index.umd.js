!function(t,e){"object"==typeof exports&&"undefined"!=typeof module?e():"function"==typeof define&&define.amd?define(e):e()}(0,function(){var t=require("mitt"),e=require("xstream").default;module.exports=function(n){return function(o){var r=new t,u=o.subscribe({next:function(t){var e=t[0],o=t[1];("object"==typeof n&&(n[o.tag]||n[e.name])||e).apply(void 0,o.args||[]).then(function(t){r.emit(o.tag,{result:t,error:null})}).catch(function(t){r.emit(o.tag,{result:null,error:t})})},complete:function(){u()}});return function(t){var n;return e.create({start:function(e){r.on(t,n=function(t){e.next(t)})},stop:function(){r.off(t,n)}})}}}});
//# sourceMappingURL=index.umd.js.map