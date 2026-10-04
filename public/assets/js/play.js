(()=>{var pd=Object.defineProperty;var md=(i,e)=>{for(var t in e)pd(i,t,{get:e[t],enumerable:!0})};var en=Object.create(null);en.open="0";en.close="1";en.ping="2";en.pong="3";en.message="4";en.upgrade="5";en.noop="6";var Sr=Object.create(null);Object.keys(en).forEach(i=>{Sr[en[i]]=i});var Mr={type:"error",data:"parser error"};var uu=typeof Blob=="function"||typeof Blob<"u"&&Object.prototype.toString.call(Blob)==="[object BlobConstructor]",fu=typeof ArrayBuffer=="function",hu=i=>typeof ArrayBuffer.isView=="function"?ArrayBuffer.isView(i):i&&i.buffer instanceof ArrayBuffer,br=({type:i,data:e},t,n)=>uu&&e instanceof Blob?t?n(e):lu(e,n):fu&&(e instanceof ArrayBuffer||hu(e))?t?n(e):lu(new Blob([e]),n):n(en[i]+(e||"")),lu=(i,e)=>{let t=new FileReader;return t.onload=function(){let n=t.result.split(",")[1];e("b"+(n||""))},t.readAsDataURL(i)};function cu(i){return i instanceof Uint8Array?i:i instanceof ArrayBuffer?new Uint8Array(i):new Uint8Array(i.buffer,i.byteOffset,i.byteLength)}var Ra;function du(i,e){if(uu&&i.data instanceof Blob)return i.data.arrayBuffer().then(cu).then(e);if(fu&&(i.data instanceof ArrayBuffer||hu(i.data)))return e(cu(i.data));br(i,!1,t=>{Ra||(Ra=new TextEncoder),e(Ra.encode(t))})}var pu="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/",wr=typeof Uint8Array>"u"?[]:new Uint8Array(256);for(let i=0;i<pu.length;i++)wr[pu.charCodeAt(i)]=i;var mu=i=>{let e=i.length*.75,t=i.length,n,r=0,s,a,o,l;i[i.length-1]==="="&&(e--,i[i.length-2]==="="&&e--);let c=new ArrayBuffer(e),u=new Uint8Array(c);for(n=0;n<t;n+=4)s=wr[i.charCodeAt(n)],a=wr[i.charCodeAt(n+1)],o=wr[i.charCodeAt(n+2)],l=wr[i.charCodeAt(n+3)],u[r++]=s<<2|a>>4,u[r++]=(a&15)<<4|o>>2,u[r++]=(o&3)<<6|l&63;return c};var gd=typeof ArrayBuffer=="function",Er=(i,e)=>{if(typeof i!="string")return{type:"message",data:gu(i,e)};let t=i.charAt(0);return t==="b"?{type:"message",data:xd(i.substring(1),e)}:Sr[t]?i.length>1?{type:Sr[t],data:i.substring(1)}:{type:Sr[t]}:Mr},xd=(i,e)=>{if(gd){let t=mu(i);return gu(t,e)}else return{base64:!0,data:i}},gu=(i,e)=>e==="blob"?i instanceof Blob?i:new Blob([i]):i instanceof ArrayBuffer?i:i.buffer;var xu="",_u=(i,e)=>{let t=i.length,n=new Array(t),r=0;i.forEach((s,a)=>{br(s,!1,o=>{n[a]=o,++r===t&&e(n.join(xu))})})},yu=(i,e)=>{let t=i.split(xu),n=[];for(let r=0;r<t.length;r++){let s=Er(t[r],e);if(n.push(s),s.type==="error")break}return n};function vu(){return new TransformStream({transform(i,e){du(i,t=>{let n=t.length,r;if(n<126)r=new Uint8Array(1),new DataView(r.buffer).setUint8(0,n);else if(n<65536){r=new Uint8Array(3);let s=new DataView(r.buffer);s.setUint8(0,126),s.setUint16(1,n)}else{r=new Uint8Array(9);let s=new DataView(r.buffer);s.setUint8(0,127),s.setBigUint64(1,BigInt(n))}i.data&&typeof i.data!="string"&&(r[0]|=128),e.enqueue(r),e.enqueue(t)})}})}var Pa;function ts(i){return i.reduce((e,t)=>e+t.length,0)}function ns(i,e){if(i[0].length===e)return i.shift();let t=new Uint8Array(e),n=0;for(let r=0;r<e;r++)t[r]=i[0][n++],n===i[0].length&&(i.shift(),n=0);return i.length&&n<i[0].length&&(i[0]=i[0].slice(n)),t}function Su(i,e){Pa||(Pa=new TextDecoder);let t=[],n=0,r=-1,s=!1;return new TransformStream({transform(a,o){for(t.push(a);;){if(n===0){if(ts(t)<1)break;let l=ns(t,1);s=(l[0]&128)===128,r=l[0]&127,r<126?n=3:r===126?n=1:n=2}else if(n===1){if(ts(t)<2)break;let l=ns(t,2);r=new DataView(l.buffer,l.byteOffset,l.length).getUint16(0),n=3}else if(n===2){if(ts(t)<8)break;let l=ns(t,8),c=new DataView(l.buffer,l.byteOffset,l.length),u=c.getUint32(0);if(u>Math.pow(2,21)-1){o.enqueue(Mr);break}r=u*Math.pow(2,32)+c.getUint32(4),n=3}else{if(ts(t)<r)break;let l=ns(t,r);o.enqueue(Er(s?l:Pa.decode(l),e)),n=0}if(r===0||r>i){o.enqueue(Mr);break}}}})}var Ia=4;function rt(i){if(i)return _d(i)}function _d(i){for(var e in rt.prototype)i[e]=rt.prototype[e];return i}rt.prototype.on=rt.prototype.addEventListener=function(i,e){return this._callbacks=this._callbacks||{},(this._callbacks["$"+i]=this._callbacks["$"+i]||[]).push(e),this};rt.prototype.once=function(i,e){function t(){this.off(i,t),e.apply(this,arguments)}return t.fn=e,this.on(i,t),this};rt.prototype.off=rt.prototype.removeListener=rt.prototype.removeAllListeners=rt.prototype.removeEventListener=function(i,e){if(this._callbacks=this._callbacks||{},arguments.length==0)return this._callbacks={},this;var t=this._callbacks["$"+i];if(!t)return this;if(arguments.length==1)return delete this._callbacks["$"+i],this;for(var n,r=0;r<t.length;r++)if(n=t[r],n===e||n.fn===e){t.splice(r,1);break}return t.length===0&&delete this._callbacks["$"+i],this};rt.prototype.emit=function(i){this._callbacks=this._callbacks||{};for(var e=new Array(arguments.length-1),t=this._callbacks["$"+i],n=1;n<arguments.length;n++)e[n-1]=arguments[n];if(t){t=t.slice(0);for(var n=0,r=t.length;n<r;++n)t[n].apply(this,e)}return this};rt.prototype.emitReserved=rt.prototype.emit;rt.prototype.listeners=function(i){return this._callbacks=this._callbacks||{},this._callbacks["$"+i]||[]};rt.prototype.hasListeners=function(i){return!!this.listeners(i).length};var Mn=typeof Promise=="function"&&typeof Promise.resolve=="function"?e=>Promise.resolve().then(e):(e,t)=>t(e,0),Pt=typeof self<"u"?self:typeof window<"u"?window:Function("return this")(),Mu="arraybuffer";function is(i,...e){return e.reduce((t,n)=>(i.hasOwnProperty(n)&&(t[n]=i[n]),t),{})}var yd=Pt.setTimeout,vd=Pt.clearTimeout;function bn(i,e){e.useNativeTimers?(i.setTimeoutFn=yd.bind(Pt),i.clearTimeoutFn=vd.bind(Pt)):(i.setTimeoutFn=Pt.setTimeout.bind(Pt),i.clearTimeoutFn=Pt.clearTimeout.bind(Pt))}var Sd=1.33;function bu(i){return typeof i=="string"?Md(i):Math.ceil((i.byteLength||i.size)*Sd)}function Md(i){let e=0,t=0;for(let n=0,r=i.length;n<r;n++)e=i.charCodeAt(n),e<128?t+=1:e<2048?t+=2:e<55296||e>=57344?t+=3:(n++,t+=4);return t}function rs(){return Date.now().toString(36).substring(3)+Math.random().toString(36).substring(2,5)}function wu(i){let e="";for(let t in i)i.hasOwnProperty(t)&&(e.length&&(e+="&"),e+=encodeURIComponent(t)+"="+encodeURIComponent(i[t]));return e}function Eu(i){let e={},t=i.split("&");for(let n=0,r=t.length;n<r;n++){let s=t[n].split("=");e[decodeURIComponent(s[0])]=decodeURIComponent(s[1])}return e}var ss=class extends Error{constructor(e,t,n){super(e),this.description=t,this.context=n,this.type="TransportError"}},wn=class extends rt{constructor(e){super(),this.writable=!1,bn(this,e),this.opts=e,this.query=e.query,this.socket=e.socket,this.supportsBinary=!e.forceBase64}onError(e,t,n){return super.emitReserved("error",new ss(e,t,n)),this}open(){return this.readyState="opening",this.doOpen(),this}close(){return(this.readyState==="opening"||this.readyState==="open")&&(this.doClose(),this.onClose()),this}send(e){this.readyState==="open"&&this.write(e)}onOpen(){this.readyState="open",this.writable=!0,super.emitReserved("open")}onData(e){let t=Er(e,this.socket.binaryType);this.onPacket(t)}onPacket(e){super.emitReserved("packet",e)}onClose(e){this.readyState="closed",super.emitReserved("close",e)}pause(e){}createUri(e,t={}){return e+"://"+this._hostname()+this._port()+this.opts.path+this._query(t)}_hostname(){let e=this.opts.hostname;return e.indexOf(":")===-1?e:"["+e+"]"}_port(){return this.opts.port&&(this.opts.secure&&Number(this.opts.port)!==443||!this.opts.secure&&Number(this.opts.port)!==80)?":"+this.opts.port:""}_query(e){let t=wu(e);return t.length?"?"+t:""}};var Tr=class extends wn{constructor(){super(...arguments),this._polling=!1}get name(){return"polling"}doOpen(){this._poll()}pause(e){this.readyState="pausing";let t=()=>{this.readyState="paused",e()};if(this._polling||!this.writable){let n=0;this._polling&&(n++,this.once("pollComplete",function(){--n||t()})),this.writable||(n++,this.once("drain",function(){--n||t()}))}else t()}_poll(){this._polling=!0,this.doPoll(),this.emitReserved("poll")}onData(e){let t=n=>{if(this.readyState==="opening"&&n.type==="open"&&this.onOpen(),n.type==="close")return this.onClose({description:"transport closed by the server"}),!1;this.onPacket(n)};yu(e,this.socket.binaryType).forEach(t),this.readyState!=="closed"&&(this._polling=!1,this.emitReserved("pollComplete"),this.readyState==="open"&&this._poll())}doClose(){let e=()=>{this.write([{type:"close"}])};this.readyState==="open"?e():this.once("open",e)}write(e){this.writable=!1,_u(e,t=>{this.doWrite(t,()=>{this.writable=!0,this.emitReserved("drain")})})}uri(){let e=this.opts.secure?"https":"http",t=this.query||{};return this.opts.timestampRequests!==!1&&(t[this.opts.timestampParam]=rs()),!this.supportsBinary&&!t.sid&&(t.b64=1),this.createUri(e,t)}};var Tu=!1;try{Tu=typeof XMLHttpRequest<"u"&&"withCredentials"in new XMLHttpRequest}catch{}var Au=Tu;function bd(){}var La=class extends Tr{constructor(e){if(super(e),typeof location<"u"){let t=location.protocol==="https:",n=location.port;n||(n=t?"443":"80"),this.xd=typeof location<"u"&&e.hostname!==location.hostname||n!==e.port}}doWrite(e,t){let n=this.request({method:"POST",data:e});n.on("success",t),n.on("error",(r,s)=>{this.onError("xhr post error",r,s)})}doPoll(){let e=this.request();e.on("data",this.onData.bind(this)),e.on("error",(t,n)=>{this.onError("xhr poll error",t,n)}),this.pollXhr=e}},Vn=class i extends rt{constructor(e,t,n){super(),this.createRequest=e,bn(this,n),this._opts=n,this._method=n.method||"GET",this._uri=t,this._data=n.data!==void 0?n.data:null,this._create()}_create(){var e;let t=is(this._opts,"agent","pfx","key","passphrase","cert","ca","ciphers","rejectUnauthorized","autoUnref");t.xdomain=!!this._opts.xd;let n=this._xhr=this.createRequest(t);try{n.open(this._method,this._uri,!0);try{if(this._opts.extraHeaders){n.setDisableHeaderCheck&&n.setDisableHeaderCheck(!0);for(let r in this._opts.extraHeaders)this._opts.extraHeaders.hasOwnProperty(r)&&n.setRequestHeader(r,this._opts.extraHeaders[r])}}catch{}if(this._method==="POST")try{n.setRequestHeader("Content-type","text/plain;charset=UTF-8")}catch{}try{n.setRequestHeader("Accept","*/*")}catch{}(e=this._opts.cookieJar)===null||e===void 0||e.addCookies(n),"withCredentials"in n&&(n.withCredentials=this._opts.withCredentials),this._opts.requestTimeout&&(n.timeout=this._opts.requestTimeout),n.onreadystatechange=()=>{var r;n.readyState===3&&((r=this._opts.cookieJar)===null||r===void 0||r.parseCookies(n.getResponseHeader("set-cookie"))),n.readyState===4&&(n.status===200||n.status===1223?this._onLoad():this.setTimeoutFn(()=>{this._onError(typeof n.status=="number"?n.status:0)},0))},n.send(this._data)}catch(r){this.setTimeoutFn(()=>{this._onError(r)},0);return}typeof document<"u"&&(this._index=i.requestsCount++,i.requests[this._index]=this)}_onError(e){this.emitReserved("error",e,this._xhr),this._cleanup(!0)}_cleanup(e){if(!(typeof this._xhr>"u"||this._xhr===null)){if(this._xhr.onreadystatechange=bd,e)try{this._xhr.abort()}catch{}typeof document<"u"&&delete i.requests[this._index],this._xhr=null}}_onLoad(){let e=this._xhr.responseText;e!==null&&(this.emitReserved("data",e),this.emitReserved("success"),this._cleanup())}abort(){this._cleanup()}};Vn.requestsCount=0;Vn.requests={};if(typeof document<"u"){if(typeof attachEvent=="function")attachEvent("onunload",Cu);else if(typeof addEventListener=="function"){let i="onpagehide"in Pt?"pagehide":"unload";addEventListener(i,Cu,!1)}}function Cu(){for(let i in Vn.requests)Vn.requests.hasOwnProperty(i)&&Vn.requests[i].abort()}var wd=(function(){let i=Ru({xdomain:!1});return i&&i.responseType!==null})(),Gn=class extends La{constructor(e){super(e);let t=e&&e.forceBase64;this.supportsBinary=wd&&!t}request(e={}){return Object.assign(e,{xd:this.xd},this.opts),new Vn(Ru,this.uri(),e)}};function Ru(i){let e=i.xdomain;try{if(typeof XMLHttpRequest<"u"&&(!e||Au))return new XMLHttpRequest}catch{}if(!e)try{return new Pt[["Active"].concat("Object").join("X")]("Microsoft.XMLHTTP")}catch{}}var Pu=typeof navigator<"u"&&typeof navigator.product=="string"&&navigator.product.toLowerCase()==="reactnative",Ua=class extends wn{get name(){return"websocket"}doOpen(){let e=this.uri(),t=this.opts.protocols,n=Pu?{}:is(this.opts,"agent","perMessageDeflate","pfx","key","passphrase","cert","ca","ciphers","rejectUnauthorized","localAddress","protocolVersion","origin","maxPayload","family","checkServerIdentity");this.opts.extraHeaders&&(n.headers=this.opts.extraHeaders);try{this.ws=this.createSocket(e,t,n)}catch(r){return this.emitReserved("error",r)}this.ws.binaryType=this.socket.binaryType,this.addEventListeners()}addEventListeners(){this.ws.onopen=()=>{this.opts.autoUnref&&this.ws._socket.unref(),this.onOpen()},this.ws.onclose=e=>this.onClose({description:"websocket connection closed",context:e}),this.ws.onmessage=e=>this.onData(e.data),this.ws.onerror=e=>this.onError("websocket error",e)}write(e){this.writable=!1;for(let t=0;t<e.length;t++){let n=e[t],r=t===e.length-1;br(n,this.supportsBinary,s=>{try{this.doWrite(n,s)}catch{}r&&Mn(()=>{this.writable=!0,this.emitReserved("drain")},this.setTimeoutFn)})}}doClose(){typeof this.ws<"u"&&(this.ws.onerror=()=>{},this.ws.close(),this.ws=null)}uri(){let e=this.opts.secure?"wss":"ws",t=this.query||{};return this.opts.timestampRequests&&(t[this.opts.timestampParam]=rs()),this.supportsBinary||(t.b64=1),this.createUri(e,t)}},Da=Pt.WebSocket||Pt.MozWebSocket,Wn=class extends Ua{createSocket(e,t,n){return Pu?new Da(e,t,n):t?new Da(e,t):new Da(e)}doWrite(e,t){this.ws.send(t)}};var Di=class extends wn{get name(){return"webtransport"}doOpen(){try{this._transport=new WebTransport(this.createUri("https"),this.opts.transportOptions[this.name])}catch(e){return this.emitReserved("error",e)}this._transport.closed.then(()=>{this.onClose()}).catch(e=>{this.onError("webtransport error",e)}),this._transport.ready.then(()=>{this._transport.createBidirectionalStream().then(e=>{let t=Su(Number.MAX_SAFE_INTEGER,this.socket.binaryType),n=e.readable.pipeThrough(t).getReader(),r=vu();r.readable.pipeTo(e.writable),this._writer=r.writable.getWriter();let s=()=>{n.read().then(({done:o,value:l})=>{o||(this.onPacket(l),s())}).catch(o=>{})};s();let a={type:"open"};this.query.sid&&(a.data=`{"sid":"${this.query.sid}"}`),this._writer.write(a).then(()=>this.onOpen())})})}write(e){this.writable=!1;for(let t=0;t<e.length;t++){let n=e[t],r=t===e.length-1;this._writer.write(n).then(()=>{r&&Mn(()=>{this.writable=!0,this.emitReserved("drain")},this.setTimeoutFn)})}}doClose(){var e;(e=this._transport)===null||e===void 0||e.close()}};var Na={websocket:Wn,webtransport:Di,polling:Gn};var Ed=/^(?:(?![^:@\/?#]+:[^:@\/]*@)(http|https|ws|wss):\/\/)?((?:(([^:@\/?#]*)(?::([^:@\/?#]*))?)?@)?((?:[a-f0-9]{0,4}:){2,7}[a-f0-9]{0,4}|[^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/,Td=["source","protocol","authority","userInfo","user","password","host","port","relative","path","directory","file","query","anchor"];function Ui(i){if(i.length>8e3)throw"URI too long";let e=i,t=i.indexOf("["),n=i.indexOf("]");t!=-1&&n!=-1&&(i=i.substring(0,t)+i.substring(t,n).replace(/:/g,";")+i.substring(n,i.length));let r=Ed.exec(i||""),s={},a=14;for(;a--;)s[Td[a]]=r[a]||"";return t!=-1&&n!=-1&&(s.source=e,s.host=s.host.substring(1,s.host.length-1).replace(/;/g,":"),s.authority=s.authority.replace("[","").replace("]","").replace(/;/g,":"),s.ipv6uri=!0),s.pathNames=Ad(s,s.path),s.queryKey=Cd(s,s.query),s}function Ad(i,e){let t=/\/{2,9}/g,n=e.replace(t,"/").split("/");return(e.slice(0,1)=="/"||e.length===0)&&n.splice(0,1),e.slice(-1)=="/"&&n.splice(n.length-1,1),n}function Cd(i,e){let t={};return e.replace(/(?:^|&)([^&=]*)=?([^&]*)/g,function(n,r,s){r&&(t[r]=s)}),t}var Oa=typeof addEventListener=="function"&&typeof removeEventListener=="function",as=[];Oa&&addEventListener("offline",()=>{as.forEach(i=>i())},!1);var ri=class i extends rt{constructor(e,t={}){var n,r;if(super(),this.binaryType=Mu,this.writeBuffer=[],this._prevBufferLen=0,this._upgrades=[],this._pingInterval=-1,this._pingTimeout=-1,this._maxPayload=-1,this._pingTimeoutTime=1/0,e&&typeof e=="object"&&(t=e,e=null),e){let s=Ui(e);t.hostname=s.host,t.secure=s.protocol==="https"||s.protocol==="wss",t.port=s.port,s.query&&(t.query=s.query)}else t.host&&(t.hostname=Ui(t.host).host);if(bn(this,t),this.secure=t.secure!=null?t.secure:typeof location<"u"&&location.protocol==="https:",t.hostname&&!t.port&&(t.port=this.secure?"443":"80"),this.hostname=t.hostname||(typeof location<"u"?location.hostname:"localhost"),this.port=t.port||(typeof location<"u"&&location.port?location.port:this.secure?"443":"80"),t.transportImplementations&&t.transports)throw new Error("specifying both 'transportImplementations' and 'transports' options is not supported");t.transportImplementations||!((n=t.transports)===null||n===void 0)&&n.length&&typeof t.transports[0]=="function"?(this.transports=[],this._transportsByName=Object.create(null),((r=t.transportImplementations)!==null&&r!==void 0?r:t.transports).forEach(s=>{let a=s.prototype.name;this.transports.push(a),this._transportsByName[a]=s})):(this.transports=t.transports?[...t.transports]:["polling","websocket","webtransport"],this._transportsByName=Na),this.opts=Object.assign({path:"/engine.io",agent:!1,withCredentials:!1,upgrade:!0,timestampParam:"t",rememberUpgrade:!1,addTrailingSlash:!0,rejectUnauthorized:!0,perMessageDeflate:{threshold:1024},transportOptions:{},closeOnBeforeunload:!1},t),this.opts.path=this.opts.path.replace(/\/$/,"")+(this.opts.addTrailingSlash?"/":""),typeof this.opts.query=="string"&&(this.opts.query=Eu(this.opts.query)),Oa&&(this.opts.closeOnBeforeunload&&(this._beforeunloadEventListener=()=>{this.transport&&(this.transport.removeAllListeners(),this.transport.close())},addEventListener("beforeunload",this._beforeunloadEventListener,!1)),this.hostname!=="localhost"&&(this._offlineEventListener=()=>{this._onClose("transport close",{description:"network connection lost"})},as.push(this._offlineEventListener))),this.opts.withCredentials&&(this._cookieJar=void 0),this._open()}createTransport(e){let t=Object.assign({},this.opts.query);t.EIO=Ia,t.transport=e,this.id&&(t.sid=this.id);let n=Object.assign({},this.opts,{query:t,socket:this,hostname:this.hostname,secure:this.secure,port:this.port},this.opts.transportOptions[e]);return new this._transportsByName[e](n)}_open(){if(this.transports.length===0){this.setTimeoutFn(()=>{this.emitReserved("error","No transports available")},0);return}let e=this.opts.rememberUpgrade&&i.priorWebsocketSuccess&&this.transports.indexOf("websocket")!==-1?"websocket":this.transports[0];this.readyState="opening";let t=this.createTransport(e);t.open(),this.setTransport(t)}setTransport(e){this.transport&&this.transport.removeAllListeners(),this.transport=e,e.on("drain",this._onDrain.bind(this)).on("packet",this._onPacket.bind(this)).on("error",this._onError.bind(this)).on("close",t=>this._onClose("transport close",t))}_probe(e){let t=this.createTransport(e),n=!1;i.priorWebsocketSuccess=!1;let r=()=>{n||(t.send([{type:"ping",data:"probe"}]),t.once("packet",f=>{if(!n)if(f.type==="pong"&&f.data==="probe"){if(this.upgrading=!0,this.emitReserved("upgrading",t),!t)return;i.priorWebsocketSuccess=t.name==="websocket",this.transport.pause(()=>{n||this.readyState!=="closed"&&(u(),this.setTransport(t),t.send([{type:"upgrade"}]),this.emitReserved("upgrade",t),t=null,this.upgrading=!1,this.flush())})}else{let d=new Error("probe error");d.transport=t.name,this.emitReserved("upgradeError",d)}}))};function s(){n||(n=!0,u(),t.close(),t=null)}let a=f=>{let d=new Error("probe error: "+f);d.transport=t.name,s(),this.emitReserved("upgradeError",d)};function o(){a("transport closed")}function l(){a("socket closed")}function c(f){t&&f.name!==t.name&&s()}let u=()=>{t.removeListener("open",r),t.removeListener("error",a),t.removeListener("close",o),this.off("close",l),this.off("upgrading",c)};t.once("open",r),t.once("error",a),t.once("close",o),this.once("close",l),this.once("upgrading",c),this._upgrades.indexOf("webtransport")!==-1&&e!=="webtransport"?this.setTimeoutFn(()=>{n||t.open()},200):t.open()}onOpen(){if(this.readyState="open",i.priorWebsocketSuccess=this.transport.name==="websocket",this.emitReserved("open"),this.flush(),this.readyState==="open"&&this.opts.upgrade)for(let e=0;e<this._upgrades.length;e++)this._probe(this._upgrades[e])}_onPacket(e){if(this.readyState==="opening"||this.readyState==="open"||this.readyState==="closing")switch(this.emitReserved("packet",e),this.emitReserved("heartbeat"),e.type){case"open":this.onHandshake(JSON.parse(e.data));break;case"ping":this._sendPacket("pong"),this.emitReserved("ping"),this.emitReserved("pong"),this._resetPingTimeout();break;case"error":let t=new Error("server error");t.code=e.data,this._onError(t);break;case"message":this.emitReserved("data",e.data),this.emitReserved("message",e.data);break}}onHandshake(e){this.emitReserved("handshake",e),this.id=e.sid,this.transport.query.sid=e.sid,this._upgrades=this._filterUpgrades(e.upgrades),this._pingInterval=e.pingInterval,this._pingTimeout=e.pingTimeout,this._maxPayload=e.maxPayload,this.onOpen(),this.readyState!=="closed"&&this._resetPingTimeout()}_resetPingTimeout(){this.clearTimeoutFn(this._pingTimeoutTimer);let e=this._pingInterval+this._pingTimeout;this._pingTimeoutTime=Date.now()+e,this._pingTimeoutTimer=this.setTimeoutFn(()=>{this._onClose("ping timeout")},e),this.opts.autoUnref&&this._pingTimeoutTimer.unref()}_onDrain(){this.writeBuffer.splice(0,this._prevBufferLen),this._prevBufferLen=0,this.writeBuffer.length===0?this.emitReserved("drain"):this.flush()}flush(){if(this.readyState!=="closed"&&this.transport.writable&&!this.upgrading&&this.writeBuffer.length){let e=this._getWritablePackets();this.transport.send(e),this._prevBufferLen=e.length,this.emitReserved("flush")}}_getWritablePackets(){if(!(this._maxPayload&&this.transport.name==="polling"&&this.writeBuffer.length>1))return this.writeBuffer;let t=1;for(let n=0;n<this.writeBuffer.length;n++){let r=this.writeBuffer[n].data;if(r&&(t+=bu(r)),n>0&&t>this._maxPayload)return this.writeBuffer.slice(0,n);t+=2}return this.writeBuffer}_hasPingExpired(){if(!this._pingTimeoutTime)return!0;let e=Date.now()>this._pingTimeoutTime;return e&&(this._pingTimeoutTime=0,Mn(()=>{this._onClose("ping timeout")},this.setTimeoutFn)),e}write(e,t,n){return this._sendPacket("message",e,t,n),this}send(e,t,n){return this._sendPacket("message",e,t,n),this}_sendPacket(e,t,n,r){if(typeof t=="function"&&(r=t,t=void 0),typeof n=="function"&&(r=n,n=null),this.readyState==="closing"||this.readyState==="closed")return;n=n||{},n.compress=n.compress!==!1;let s={type:e,data:t,options:n};this.emitReserved("packetCreate",s),this.writeBuffer.push(s),r&&this.once("flush",r),this.flush()}close(){let e=()=>{this._onClose("forced close"),this.transport.close()},t=()=>{this.off("upgrade",t),this.off("upgradeError",t),e()},n=()=>{this.once("upgrade",t),this.once("upgradeError",t)};return(this.readyState==="opening"||this.readyState==="open")&&(this.readyState="closing",this.writeBuffer.length?this.once("drain",()=>{this.upgrading?n():e()}):this.upgrading?n():e()),this}_onError(e){if(i.priorWebsocketSuccess=!1,this.opts.tryAllTransports&&this.transports.length>1&&this.readyState==="opening")return this.transports.shift(),this._open();this.emitReserved("error",e),this._onClose("transport error",e)}_onClose(e,t){if(this.readyState==="opening"||this.readyState==="open"||this.readyState==="closing"){if(this.clearTimeoutFn(this._pingTimeoutTimer),this.transport.removeAllListeners("close"),this.transport.close(),this.transport.removeAllListeners(),Oa&&(this._beforeunloadEventListener&&removeEventListener("beforeunload",this._beforeunloadEventListener,!1),this._offlineEventListener)){let n=as.indexOf(this._offlineEventListener);n!==-1&&as.splice(n,1)}this.readyState="closed",this.id=null,this.emitReserved("close",e,t),this.writeBuffer=[],this._prevBufferLen=0}}_filterUpgrades(e){let t=[];for(let n=0;n<e.length;n++)~this.transports.indexOf(e[n])&&t.push(e[n]);return t}};ri.protocol=Ia;var jv=ri.protocol;function Iu(i,e="",t){let n=i;t=t||typeof location<"u"&&location,i==null&&(i=t.protocol+"//"+t.host),typeof i=="string"&&(i.charAt(0)==="/"&&(i.charAt(1)==="/"?i=t.protocol+i:i=t.host+i),/^(https?|wss?):\/\//.test(i)||(typeof t<"u"?i=t.protocol+"//"+i:i="https://"+i),n=Ui(i)),n.port||(/^(http|ws)$/.test(n.protocol)?n.port="80":/^(http|ws)s$/.test(n.protocol)&&(n.port="443")),n.path=n.path||"/";let s=n.host.indexOf(":")!==-1?"["+n.host+"]":n.host;return n.id=n.protocol+"://"+s+":"+n.port+e,n.href=n.protocol+"://"+s+(t&&t.port===n.port?"":":"+n.port),n}var Ha={};md(Ha,{Decoder:()=>ka,Encoder:()=>Ba,PacketType:()=>Ue,isPacketValid:()=>Fd,protocol:()=>Ou});var Pd=typeof ArrayBuffer=="function",Id=i=>typeof ArrayBuffer.isView=="function"?ArrayBuffer.isView(i):i.buffer instanceof ArrayBuffer,Lu=Object.prototype.toString,Ld=typeof Blob=="function"||typeof Blob<"u"&&Lu.call(Blob)==="[object BlobConstructor]",Dd=typeof File=="function"||typeof File<"u"&&Lu.call(File)==="[object FileConstructor]";function Cr(i){return Pd&&(i instanceof ArrayBuffer||Id(i))||Ld&&i instanceof Blob||Dd&&i instanceof File}function Ar(i,e){if(!i||typeof i!="object")return!1;if(Array.isArray(i)){for(let t=0,n=i.length;t<n;t++)if(Ar(i[t]))return!0;return!1}if(Cr(i))return!0;if(i.toJSON&&typeof i.toJSON=="function"&&arguments.length===1)return Ar(i.toJSON(),!0);for(let t in i)if(Object.prototype.hasOwnProperty.call(i,t)&&Ar(i[t]))return!0;return!1}function Du(i){let e=[],t=i.data,n=i;return n.data=os(t,e),n.attachments=e.length,{packet:n,buffers:e}}function os(i,e,t){if(!i)return i;if(Cr(i)){let n={_placeholder:!0,num:e.length};return e.push(i),n}else if(Array.isArray(i)){let n=new Array(i.length);for(let r=0;r<i.length;r++)n[r]=os(i[r],e);return n}else if(typeof i=="object"&&!(i instanceof Date)){if(i.toJSON&&typeof i.toJSON=="function"&&!t)return os(i.toJSON(),e,!0);let n={};for(let r in i)Object.prototype.hasOwnProperty.call(i,r)&&(n[r]=os(i[r],e));return n}return i}function Uu(i,e){return i.data=Fa(i.data,e),delete i.attachments,i}function Fa(i,e){if(!i)return i;if(i&&i._placeholder===!0){if(typeof i.num=="number"&&i.num>=0&&i.num<e.length)return e[i.num];throw new Error("illegal attachments")}else if(Array.isArray(i))for(let t=0;t<i.length;t++)i[t]=Fa(i[t],e);else if(typeof i=="object")for(let t in i)Object.prototype.hasOwnProperty.call(i,t)&&(i[t]=Fa(i[t],e));return i}var Nu=["connect","connect_error","disconnect","disconnecting","newListener","removeListener"],Ou=5,Ue;(function(i){i[i.CONNECT=0]="CONNECT",i[i.DISCONNECT=1]="DISCONNECT",i[i.EVENT=2]="EVENT",i[i.ACK=3]="ACK",i[i.CONNECT_ERROR=4]="CONNECT_ERROR",i[i.BINARY_EVENT=5]="BINARY_EVENT",i[i.BINARY_ACK=6]="BINARY_ACK"})(Ue||(Ue={}));var Ba=class{constructor(e){this.replacer=e}encode(e){return(e.type===Ue.EVENT||e.type===Ue.ACK)&&Ar(e)?this.encodeAsBinary({type:e.type===Ue.EVENT?Ue.BINARY_EVENT:Ue.BINARY_ACK,nsp:e.nsp,data:e.data,id:e.id}):[this.encodeAsString(e)]}encodeAsString(e){let t=""+e.type;return(e.type===Ue.BINARY_EVENT||e.type===Ue.BINARY_ACK)&&(t+=e.attachments+"-"),e.nsp&&e.nsp!=="/"&&(t+=e.nsp+","),e.id!=null&&(t+=e.id),e.data!=null&&(t+=JSON.stringify(e.data,this.replacer)),t}encodeAsBinary(e){let t=Du(e),n=this.encodeAsString(t.packet),r=t.buffers;return r.unshift(n),r}},ka=class i extends rt{constructor(e){super(),this.opts=Object.assign({reviver:void 0,maxAttachments:10},typeof e=="function"?{reviver:e}:e)}add(e){let t;if(typeof e=="string"){if(this.reconstructor)throw new Error("got plaintext data when reconstructing a packet");t=this.decodeString(e);let n=t.type===Ue.BINARY_EVENT;n||t.type===Ue.BINARY_ACK?(t.type=n?Ue.EVENT:Ue.ACK,this.reconstructor=new za(t)):super.emitReserved("decoded",t)}else if(Cr(e)||e.base64)if(this.reconstructor)t=this.reconstructor.takeBinaryData(e),t&&(this.reconstructor=null,super.emitReserved("decoded",t));else throw new Error("got binary data when not reconstructing a packet");else throw new Error("Unknown type: "+e)}decodeString(e){let t=0,n={type:Number(e.charAt(0))};if(Ue[n.type]===void 0)throw new Error("unknown packet type "+n.type);if(n.type===Ue.BINARY_EVENT||n.type===Ue.BINARY_ACK){let s=t+1;for(;e.charAt(++t)!=="-"&&t!=e.length;);let a=e.substring(s,t);if(a!=Number(a)||e.charAt(t)!=="-")throw new Error("Illegal attachments");let o=Number(a);if(!Fu(o)||o<1)throw new Error("Illegal attachments");if(o>this.opts.maxAttachments)throw new Error("too many attachments");n.attachments=o}if(e.charAt(t+1)==="/"){let s=t+1;for(;++t&&!(e.charAt(t)===","||t===e.length););n.nsp=e.substring(s,t)}else n.nsp="/";let r=e.charAt(t+1);if(r!==""&&Number(r)==r){let s=t+1;for(;++t;){let a=e.charAt(t);if(a==null||Number(a)!=a){--t;break}if(t===e.length)break}n.id=Number(e.substring(s,t+1))}if(e.charAt(++t)){let s=this.tryParse(e.substr(t));if(i.isPayloadValid(n.type,s))n.data=s;else throw new Error("invalid payload")}return n}tryParse(e){try{return JSON.parse(e,this.opts.reviver)}catch{return!1}}static isPayloadValid(e,t){switch(e){case Ue.CONNECT:return ls(t);case Ue.DISCONNECT:return t===void 0;case Ue.CONNECT_ERROR:return typeof t=="string"||ls(t);case Ue.EVENT:case Ue.BINARY_EVENT:return Array.isArray(t)&&(typeof t[0]=="number"||typeof t[0]=="string"&&Nu.indexOf(t[0])===-1);case Ue.ACK:case Ue.BINARY_ACK:return Array.isArray(t)}}destroy(){this.reconstructor&&(this.reconstructor.finishedReconstruction(),this.reconstructor=null)}},za=class{constructor(e){this.packet=e,this.buffers=[],this.reconPack=e}takeBinaryData(e){if(this.buffers.push(e),this.buffers.length===this.reconPack.attachments){let t=Uu(this.reconPack,this.buffers);return this.finishedReconstruction(),t}return null}finishedReconstruction(){this.reconPack=null,this.buffers=[]}};function Ud(i){return typeof i=="string"}var Fu=Number.isInteger||function(i){return typeof i=="number"&&isFinite(i)&&Math.floor(i)===i};function Nd(i){return i===void 0||Fu(i)}function ls(i){return Object.prototype.toString.call(i)==="[object Object]"}function Od(i,e){switch(i){case Ue.CONNECT:return e===void 0||ls(e);case Ue.DISCONNECT:return e===void 0;case Ue.EVENT:return Array.isArray(e)&&(typeof e[0]=="number"||typeof e[0]=="string"&&Nu.indexOf(e[0])===-1);case Ue.ACK:return Array.isArray(e);case Ue.CONNECT_ERROR:return typeof e=="string"||ls(e);default:return!1}}function Fd(i){return Ud(i.nsp)&&Nd(i.id)&&Od(i.type,i.data)}function kt(i,e,t){return i.on(e,t),function(){i.off(e,t)}}var Bd=Object.freeze({connect:1,connect_error:1,disconnect:1,disconnecting:1,newListener:1,removeListener:1}),Ni=class extends rt{constructor(e,t,n){super(),this.connected=!1,this.recovered=!1,this.receiveBuffer=[],this.sendBuffer=[],this._queue=[],this._queueSeq=0,this.ids=0,this.acks={},this.flags={},this.io=e,this.nsp=t,n&&n.auth&&(this.auth=n.auth),this._opts=Object.assign({},n),this.io._autoConnect&&this.open()}get disconnected(){return!this.connected}subEvents(){if(this.subs)return;let e=this.io;this.subs=[kt(e,"open",this.onopen.bind(this)),kt(e,"packet",this.onpacket.bind(this)),kt(e,"error",this.onerror.bind(this)),kt(e,"close",this.onclose.bind(this))]}get active(){return!!this.subs}connect(){return this.connected?this:(this.subEvents(),this.io._reconnecting||this.io.open(),this.io._readyState==="open"&&this.onopen(),this)}open(){return this.connect()}send(...e){return e.unshift("message"),this.emit.apply(this,e),this}emit(e,...t){var n,r,s;if(Bd.hasOwnProperty(e))throw new Error('"'+e.toString()+'" is a reserved event name');if(t.unshift(e),this._opts.retries&&!this.flags.fromQueue&&!this.flags.volatile)return this._addToQueue(t),this;let a={type:Ue.EVENT,data:t};if(a.options={},a.options.compress=this.flags.compress!==!1,typeof t[t.length-1]=="function"){let u=this.ids++,f=t.pop();this._registerAckCallback(u,f),a.id=u}let o=(r=(n=this.io.engine)===null||n===void 0?void 0:n.transport)===null||r===void 0?void 0:r.writable,l=this.connected&&!(!((s=this.io.engine)===null||s===void 0)&&s._hasPingExpired());return this.flags.volatile&&!o||(l?(this.notifyOutgoingListeners(a),this.packet(a)):this.sendBuffer.push(a)),this.flags={},this}_registerAckCallback(e,t){var n;let r=(n=this.flags.timeout)!==null&&n!==void 0?n:this._opts.ackTimeout;if(r===void 0){this.acks[e]=t;return}let s=this.io.setTimeoutFn(()=>{delete this.acks[e];for(let o=0;o<this.sendBuffer.length;o++)this.sendBuffer[o].id===e&&this.sendBuffer.splice(o,1);t.call(this,new Error("operation has timed out"))},r),a=(...o)=>{this.io.clearTimeoutFn(s),t.apply(this,o)};a.withError=!0,this.acks[e]=a}emitWithAck(e,...t){return new Promise((n,r)=>{let s=(a,o)=>a?r(a):n(o);s.withError=!0,t.push(s),this.emit(e,...t)})}_addToQueue(e){let t;typeof e[e.length-1]=="function"&&(t=e.pop());let n={id:this._queueSeq++,tryCount:0,pending:!1,args:e,flags:Object.assign({fromQueue:!0},this.flags)};e.push((r,...s)=>(this._queue[0],r!==null?n.tryCount>this._opts.retries&&(this._queue.shift(),t&&t(r)):(this._queue.shift(),t&&t(null,...s)),n.pending=!1,this._drainQueue())),this._queue.push(n),this._drainQueue()}_drainQueue(e=!1){if(!this.connected||this._queue.length===0)return;let t=this._queue[0];t.pending&&!e||(t.pending=!0,t.tryCount++,this.flags=t.flags,this.emit.apply(this,t.args))}packet(e){e.nsp=this.nsp,this.io._packet(e)}onopen(){typeof this.auth=="function"?this.auth(e=>{this._sendConnectPacket(e)}):this._sendConnectPacket(this.auth)}_sendConnectPacket(e){this.packet({type:Ue.CONNECT,data:this._pid?Object.assign({pid:this._pid,offset:this._lastOffset},e):e})}onerror(e){this.connected||this.emitReserved("connect_error",e)}onclose(e,t){this.connected=!1,delete this.id,this.emitReserved("disconnect",e,t),this._clearAcks()}_clearAcks(){Object.keys(this.acks).forEach(e=>{if(!this.sendBuffer.some(n=>String(n.id)===e)){let n=this.acks[e];delete this.acks[e],n.withError&&n.call(this,new Error("socket has been disconnected"))}})}onpacket(e){if(e.nsp===this.nsp)switch(e.type){case Ue.CONNECT:e.data&&e.data.sid?this.onconnect(e.data.sid,e.data.pid):this.emitReserved("connect_error",new Error("It seems you are trying to reach a Socket.IO server in v2.x with a v3.x client, but they are not compatible (more information here: https://socket.io/docs/v3/migrating-from-2-x-to-3-0/)"));break;case Ue.EVENT:case Ue.BINARY_EVENT:this.onevent(e);break;case Ue.ACK:case Ue.BINARY_ACK:this.onack(e);break;case Ue.DISCONNECT:this.ondisconnect();break;case Ue.CONNECT_ERROR:this.destroy();let n=new Error(e.data.message);n.data=e.data.data,this.emitReserved("connect_error",n);break}}onevent(e){let t=e.data||[];e.id!=null&&t.push(this.ack(e.id)),this.connected?this.emitEvent(t):this.receiveBuffer.push(Object.freeze(t))}emitEvent(e){if(this._anyListeners&&this._anyListeners.length){let t=this._anyListeners.slice();for(let n of t)n.apply(this,e)}super.emit.apply(this,e),this._pid&&e.length&&typeof e[e.length-1]=="string"&&(this._lastOffset=e[e.length-1])}ack(e){let t=this,n=!1;return function(...r){n||(n=!0,t.packet({type:Ue.ACK,id:e,data:r}))}}onack(e){let t=this.acks[e.id];typeof t=="function"&&(delete this.acks[e.id],t.withError&&e.data.unshift(null),t.apply(this,e.data))}onconnect(e,t){this.id=e,this.recovered=t&&this._pid===t,this._pid=t,this.connected=!0,this.emitBuffered(),this._drainQueue(!0),this.emitReserved("connect")}emitBuffered(){this.receiveBuffer.forEach(e=>this.emitEvent(e)),this.receiveBuffer=[],this.sendBuffer.forEach(e=>{this.notifyOutgoingListeners(e),this.packet(e)}),this.sendBuffer=[]}ondisconnect(){this.destroy(),this.onclose("io server disconnect")}destroy(){this.subs&&(this.subs.forEach(e=>e()),this.subs=void 0),this.io._destroy(this)}disconnect(){return this.connected&&this.packet({type:Ue.DISCONNECT}),this.destroy(),this.connected&&this.onclose("io client disconnect"),this}close(){return this.disconnect()}compress(e){return this.flags.compress=e,this}get volatile(){return this.flags.volatile=!0,this}timeout(e){return this.flags.timeout=e,this}onAny(e){return this._anyListeners=this._anyListeners||[],this._anyListeners.push(e),this}prependAny(e){return this._anyListeners=this._anyListeners||[],this._anyListeners.unshift(e),this}offAny(e){if(!this._anyListeners)return this;if(e){let t=this._anyListeners;for(let n=0;n<t.length;n++)if(e===t[n])return t.splice(n,1),this}else this._anyListeners=[];return this}listenersAny(){return this._anyListeners||[]}onAnyOutgoing(e){return this._anyOutgoingListeners=this._anyOutgoingListeners||[],this._anyOutgoingListeners.push(e),this}prependAnyOutgoing(e){return this._anyOutgoingListeners=this._anyOutgoingListeners||[],this._anyOutgoingListeners.unshift(e),this}offAnyOutgoing(e){if(!this._anyOutgoingListeners)return this;if(e){let t=this._anyOutgoingListeners;for(let n=0;n<t.length;n++)if(e===t[n])return t.splice(n,1),this}else this._anyOutgoingListeners=[];return this}listenersAnyOutgoing(){return this._anyOutgoingListeners||[]}notifyOutgoingListeners(e){if(this._anyOutgoingListeners&&this._anyOutgoingListeners.length){let t=this._anyOutgoingListeners.slice();for(let n of t)n.apply(this,e.data)}}};function si(i){i=i||{},this.ms=i.min||100,this.max=i.max||1e4,this.factor=i.factor||2,this.jitter=i.jitter>0&&i.jitter<=1?i.jitter:0,this.attempts=0}si.prototype.duration=function(){var i=this.ms*Math.pow(this.factor,this.attempts++);if(this.jitter){var e=Math.random(),t=Math.floor(e*this.jitter*i);i=(Math.floor(e*10)&1)==0?i-t:i+t}return Math.min(i,this.max)|0};si.prototype.reset=function(){this.attempts=0};si.prototype.setMin=function(i){this.ms=i};si.prototype.setMax=function(i){this.max=i};si.prototype.setJitter=function(i){this.jitter=i};var Oi=class extends rt{constructor(e,t){var n;super(),this.nsps={},this.subs=[],e&&typeof e=="object"&&(t=e,e=void 0),t=t||{},t.path=t.path||"/socket.io",this.opts=t,bn(this,t),this.reconnection(t.reconnection!==!1),this.reconnectionAttempts(t.reconnectionAttempts||1/0),this.reconnectionDelay(t.reconnectionDelay||1e3),this.reconnectionDelayMax(t.reconnectionDelayMax||5e3),this.randomizationFactor((n=t.randomizationFactor)!==null&&n!==void 0?n:.5),this.backoff=new si({min:this.reconnectionDelay(),max:this.reconnectionDelayMax(),jitter:this.randomizationFactor()}),this.timeout(t.timeout==null?2e4:t.timeout),this._readyState="closed",this.uri=e;let r=t.parser||Ha;this.encoder=new r.Encoder,this.decoder=new r.Decoder,this._autoConnect=t.autoConnect!==!1,this._autoConnect&&this.open()}reconnection(e){return arguments.length?(this._reconnection=!!e,e||(this.skipReconnect=!0),this):this._reconnection}reconnectionAttempts(e){return e===void 0?this._reconnectionAttempts:(this._reconnectionAttempts=e,this)}reconnectionDelay(e){var t;return e===void 0?this._reconnectionDelay:(this._reconnectionDelay=e,(t=this.backoff)===null||t===void 0||t.setMin(e),this)}randomizationFactor(e){var t;return e===void 0?this._randomizationFactor:(this._randomizationFactor=e,(t=this.backoff)===null||t===void 0||t.setJitter(e),this)}reconnectionDelayMax(e){var t;return e===void 0?this._reconnectionDelayMax:(this._reconnectionDelayMax=e,(t=this.backoff)===null||t===void 0||t.setMax(e),this)}timeout(e){return arguments.length?(this._timeout=e,this):this._timeout}maybeReconnectOnOpen(){!this._reconnecting&&this._reconnection&&this.backoff.attempts===0&&this.reconnect()}open(e){if(~this._readyState.indexOf("open"))return this;this.engine=new ri(this.uri,this.opts);let t=this.engine,n=this;this._readyState="opening",this.skipReconnect=!1;let r=kt(t,"open",function(){n.onopen(),e&&e()}),s=o=>{this.cleanup(),this._readyState="closed",this.emitReserved("error",o),e?e(o):this.maybeReconnectOnOpen()},a=kt(t,"error",s);if(this._timeout!==!1){let o=this._timeout,l=this.setTimeoutFn(()=>{r(),s(new Error("timeout")),t.close()},o);this.opts.autoUnref&&l.unref(),this.subs.push(()=>{this.clearTimeoutFn(l)})}return this.subs.push(r),this.subs.push(a),this}connect(e){return this.open(e)}onopen(){this.cleanup(),this._readyState="open",this.emitReserved("open");let e=this.engine;this.subs.push(kt(e,"ping",this.onping.bind(this)),kt(e,"data",this.ondata.bind(this)),kt(e,"error",this.onerror.bind(this)),kt(e,"close",this.onclose.bind(this)),kt(this.decoder,"decoded",this.ondecoded.bind(this)))}onping(){this.emitReserved("ping")}ondata(e){try{this.decoder.add(e)}catch(t){this.onclose("parse error",t)}}ondecoded(e){Mn(()=>{this.emitReserved("packet",e)},this.setTimeoutFn)}onerror(e){this.emitReserved("error",e)}socket(e,t){let n=this.nsps[e];return n?this._autoConnect&&!n.active&&n.connect():(n=new Ni(this,e,t),this.nsps[e]=n),n}_destroy(e){let t=Object.keys(this.nsps);for(let n of t)if(this.nsps[n].active)return;this._close()}_packet(e){let t=this.encoder.encode(e);for(let n=0;n<t.length;n++)this.engine.write(t[n],e.options)}cleanup(){this.subs.forEach(e=>e()),this.subs.length=0,this.decoder.destroy()}_close(){this.skipReconnect=!0,this._reconnecting=!1,this.onclose("forced close")}disconnect(){return this._close()}onclose(e,t){var n;this.cleanup(),(n=this.engine)===null||n===void 0||n.close(),this.backoff.reset(),this._readyState="closed",this.emitReserved("close",e,t),this._reconnection&&!this.skipReconnect&&this.reconnect()}reconnect(){if(this._reconnecting||this.skipReconnect)return this;let e=this;if(this.backoff.attempts>=this._reconnectionAttempts)this.backoff.reset(),this.emitReserved("reconnect_failed"),this._reconnecting=!1;else{let t=this.backoff.duration();this._reconnecting=!0;let n=this.setTimeoutFn(()=>{e.skipReconnect||(this.emitReserved("reconnect_attempt",e.backoff.attempts),!e.skipReconnect&&e.open(r=>{r?(e._reconnecting=!1,e.reconnect(),this.emitReserved("reconnect_error",r)):e.onreconnect()}))},t);this.opts.autoUnref&&n.unref(),this.subs.push(()=>{this.clearTimeoutFn(n)})}}onreconnect(){let e=this.backoff.attempts;this._reconnecting=!1,this.backoff.reset(),this.emitReserved("reconnect",e)}};var Rr={};function Pr(i,e){typeof i=="object"&&(e=i,i=void 0),e=e||{};let t=Iu(i,e.path||"/socket.io"),n=t.source,r=t.id,s=t.path,a=Rr[r]&&s in Rr[r].nsps,o=e.forceNew||e["force new connection"]||e.multiplex===!1||a,l;return o?l=new Oi(n,e):(Rr[r]||(Rr[r]=new Oi(n,e)),l=Rr[r]),t.query&&!e.query&&(e.query=t.queryKey),l.socket(t.path,e)}Object.assign(Pr,{Manager:Oi,Socket:Ni,io:Pr,connect:Pr});var cs={xmlns:"http://www.w3.org/2000/svg",width:24,height:24,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor","stroke-width":2,"stroke-linecap":"round","stroke-linejoin":"round"};var Bu=([i,e,t])=>{let n=document.createElementNS("http://www.w3.org/2000/svg",i);return Object.keys(e).forEach(r=>{n.setAttribute(r,String(e[r]))}),t?.length&&t.forEach(r=>{let s=Bu(r);n.appendChild(s)}),n},ku=(i,e={})=>{let n={...cs,...e};return Bu(["svg",n,i])};var zu=(...i)=>i.filter((e,t,n)=>!!e&&e.trim()!==""&&n.indexOf(e)===t).join(" ").trim();var Hu=i=>{for(let e in i)if(e.startsWith("aria-")||e==="role"||e==="title")return!0;return!1};var Vu=i=>{let e="",t=!1;for(let n of i){if(n==="-"||n==="_"||n<=" "){t=e.length>0;continue}e.length===0?e+=n.toLowerCase():e+=t?n.toUpperCase():n,t=!1}return e};var Gu=i=>{let e=Vu(i);return e.charAt(0).toUpperCase()+e.slice(1)};var kd=i=>Array.from(i.attributes).reduce((e,t)=>(e[t.name]=t.value,e),{}),Wu=i=>typeof i=="string"?i:!i||!i.class?"":i.class&&typeof i.class=="string"?i.class.split(" "):i.class&&Array.isArray(i.class)?i.class:"",Va=(i,{nameAttr:e,icons:t,attrs:n})=>{let r=i.getAttribute(e);if(r==null)return;let s=Gu(r),a=t[s];if(!a)return console.warn(`${i.outerHTML} icon name was not found in the provided icons object.`);let o=kd(i),l=Hu(o)?{}:{"aria-hidden":"true"},c={...cs,"data-lucide":r,...l,...n,...o},u=Wu(o),f=Wu(n),d=zu("lucide",`lucide-${r}`,...u,...f);d&&Object.assign(c,{class:d});let p=ku(a,c);return i.parentNode?.replaceChild(p,i)};var Ga=[["path",{d:"M12 6v16"}],["path",{d:"m19 13 2-1a9 9 0 0 1-18 0l2 1"}],["path",{d:"M9 11h6"}],["circle",{cx:"12",cy:"4",r:"2"}]];var us=[["path",{d:"M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z"}],["path",{d:"m16 9-5.5 5.5L8 12"}]];var fs=[["path",{d:"M10 12h4"}],["path",{d:"M10 8h4"}],["path",{d:"M14 21v-3a2 2 0 0 0-4 0v3"}],["path",{d:"M6 10H4a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-2"}],["path",{d:"M6 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16"}]];var Wa=[["path",{d:"M20 6 9 17l-5-5"}]];var Xa=[["path",{d:"m9 18 6-6-6-6"}]];var hs=[["circle",{cx:"12",cy:"12",r:"10"}],["path",{d:"m16 9-5.5 5.5L8 12"}]];var Ir=[["circle",{cx:"12",cy:"12",r:"10"}],["path",{d:"M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"}],["path",{d:"M12 17h.01"}]];var qa=[["circle",{cx:"12",cy:"12",r:"10"}],["path",{d:"M12 6v6l4 2"}]];var Ya=[["path",{d:"M13.744 17.736a6 6 0 1 1-7.48-7.48"}],["path",{d:"M15 6h1v4"}],["path",{d:"m6.134 14.768.866-.5 2 3.464"}],["circle",{cx:"16",cy:"8",r:"6"}]];var $a=[["rect",{width:"14",height:"14",x:"8",y:"8",rx:"2",ry:"2"}],["path",{d:"M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"}]];var Za=[["path",{d:"M12 20v2"}],["path",{d:"M12 2v2"}],["path",{d:"M17 20v2"}],["path",{d:"M17 2v2"}],["path",{d:"M2 12h2"}],["path",{d:"M2 17h2"}],["path",{d:"M2 7h2"}],["path",{d:"M20 12h2"}],["path",{d:"M20 17h2"}],["path",{d:"M20 7h2"}],["path",{d:"M7 20v2"}],["path",{d:"M7 2v2"}],["rect",{x:"4",y:"4",width:"16",height:"16",rx:"2"}],["rect",{x:"8",y:"8",width:"8",height:"8",rx:"1"}]];var Ka=[["rect",{width:"18",height:"18",x:"3",y:"3",rx:"2",ry:"2"}],["path",{d:"M16 8h.01"}],["path",{d:"M8 8h.01"}],["path",{d:"M8 16h.01"}],["path",{d:"M16 16h.01"}],["path",{d:"M12 12h.01"}]];var Ja=[["path",{d:"M12 16h.01"}],["path",{d:"M16 16h.01"}],["path",{d:"M3 19a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8.5a.5.5 0 0 0-.769-.422l-4.462 2.844A.5.5 0 0 1 15 10.5v-2a.5.5 0 0 0-.769-.422L9.77 10.922A.5.5 0 0 1 9 10.5V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2z"}],["path",{d:"M8 16h.01"}]];var ja=[["path",{d:"M12 3q1 4 4 6.5t3 5.5a1 1 0 0 1-14 0 5 5 0 0 1 1-3 1 1 0 0 0 5 0c0-2-1.5-3-1.5-5q0-2 2.5-4"}]];var Qa=[["path",{d:"m14 13-8.381 8.38a1 1 0 0 1-3.001-3l8.384-8.381"}],["path",{d:"m16 16 6-6"}],["path",{d:"m21.5 10.5-8-8"}],["path",{d:"m8 8 6-6"}],["path",{d:"m8.5 7.5 8 8"}]];var eo=[["path",{d:"m15 12-9.373 9.373a1 1 0 0 1-3.001-3L12 9"}],["path",{d:"m18 15 4-4"}],["path",{d:"m21.5 11.5-1.914-1.914A2 2 0 0 1 19 8.172v-.344a2 2 0 0 0-.586-1.414l-1.657-1.657A6 6 0 0 0 12.516 3H9l1.243 1.243A6 6 0 0 1 12 8.485V10l2 2h1.172a2 2 0 0 1 1.414.586L18.5 14.5"}]];var ds=[["path",{d:"M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"}],["path",{d:"M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"}]];var to=[["circle",{cx:"12",cy:"12",r:"10"}],["path",{d:"M12 16v-4"}],["path",{d:"M12 8h.01"}]];var no=[["path",{d:"M10 18v-7"}],["path",{d:"M11.119 2.205a2 2 0 0 1 1.762 0l7.84 3.846A.5.5 0 0 1 20.5 7h-17a.5.5 0 0 1-.22-.949z"}],["path",{d:"M14 18v-7"}],["path",{d:"M18 18v-7"}],["path",{d:"M3 22h18"}],["path",{d:"M6 18v-7"}]];var io=[["rect",{width:"18",height:"11",x:"3",y:"11",rx:"2",ry:"2"}],["path",{d:"M7 11V7a5 5 0 0 1 10 0v4"}]];var ro=[["path",{d:"m16 17 5-5-5-5"}],["path",{d:"M21 12H9"}],["path",{d:"M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"}]];var so=[["path",{d:"M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"}],["circle",{cx:"12",cy:"10",r:"3"}]];var ao=[["path",{d:"M11 6a13 13 0 0 0 8.4-2.8A1 1 0 0 1 21 4v12a1 1 0 0 1-1.6.8A13 13 0 0 0 11 14H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z"}],["path",{d:"M6 14a12 12 0 0 0 2.4 7.2 2 2 0 0 0 3.2-2.4A8 8 0 0 1 10 14"}],["path",{d:"M8 6v8"}]];var oo=[["path",{d:"M4 5h16"}],["path",{d:"M4 12h16"}],["path",{d:"M4 19h16"}]];var lo=[["path",{d:"M5 12h14"}]];var co=[["path",{d:"M15 18h-5"}],["path",{d:"M18 14h-8"}],["path",{d:"M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-4 0v-9a2 2 0 0 1 2-2h2"}],["rect",{width:"8",height:"4",x:"10",y:"6",rx:"1"}]];var uo=[["rect",{x:"14",y:"3",width:"5",height:"18",rx:"1"}],["rect",{x:"5",y:"3",width:"5",height:"18",rx:"1"}]];var fo=[["path",{d:"M5 5a2 2 0 0 1 3.008-1.728l11.997 6.998a2 2 0 0 1 .003 3.458l-12 7A2 2 0 0 1 5 19z"}]];var ho=[["path",{d:"M5 12h14"}],["path",{d:"M12 5v14"}]];var po=[["path",{d:"M16.247 7.761a6 6 0 0 1 0 8.478"}],["path",{d:"M19.075 4.933a10 10 0 0 1 0 14.134"}],["path",{d:"M4.925 19.067a10 10 0 0 1 0-14.134"}],["path",{d:"M7.753 16.239a6 6 0 0 1 0-8.478"}],["circle",{cx:"12",cy:"12",r:"2"}]];var mo=[["path",{d:"M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"}],["path",{d:"M21 3v5h-5"}],["path",{d:"M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"}],["path",{d:"M8 16H3v5"}]];var go=[["path",{d:"M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z"}],["path",{d:"m21.854 2.147-10.94 10.939"}]];var xo=[["path",{d:"M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"}],["path",{d:"m9 12 2 2 4-4"}]];var _o=[["path",{d:"M7 18v-6a5 5 0 1 1 10 0v6"}],["path",{d:"M5 21a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-1a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2z"}],["path",{d:"M21 12h1"}],["path",{d:"M18.5 4.5 18 5"}],["path",{d:"M2 12h1"}],["path",{d:"M12 2v1"}],["path",{d:"m4.929 4.929.707.707"}],["path",{d:"M12 12v6"}]];var ps=[["path",{d:"M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z"}],["path",{d:"M20 2v4"}],["path",{d:"M22 4h-4"}],["circle",{cx:"4",cy:"20",r:"2"}]];var yo=[["path",{d:"M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"}]];var vo=[["path",{d:"M15 21v-5a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v5"}],["path",{d:"M17.774 10.31a1.12 1.12 0 0 0-1.549 0 2.5 2.5 0 0 1-3.451 0 1.12 1.12 0 0 0-1.548 0 2.5 2.5 0 0 1-3.452 0 1.12 1.12 0 0 0-1.549 0 2.5 2.5 0 0 1-3.77-3.248l2.889-4.184A2 2 0 0 1 7 2h10a2 2 0 0 1 1.653.873l2.895 4.192a2.5 2.5 0 0 1-3.774 3.244"}],["path",{d:"M4 10.95V19a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8.05"}]];var So=[["path",{d:"M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"}],["path",{d:"M13 5v2"}],["path",{d:"M13 17v2"}],["path",{d:"M13 11v2"}]];var Mo=[["path",{d:"M8 3.1V7a4 4 0 0 0 8 0V3.1"}],["path",{d:"m9 15-1-1"}],["path",{d:"m15 15 1-1"}],["path",{d:"M9 19c-2.8 0-5-2.2-5-5v-4a8 8 0 0 1 16 0v4c0 2.8-2.2 5-5 5Z"}],["path",{d:"m8 19-2 3"}],["path",{d:"m16 19 2 3"}]];var bo=[["path",{d:"M10 10v.2A3 3 0 0 1 8.9 16H5a3 3 0 0 1-1-5.8V10a3 3 0 0 1 6 0Z"}],["path",{d:"M7 16v6"}],["path",{d:"M13 19v3"}],["path",{d:"M12 19h8.3a1 1 0 0 0 .7-1.7L18 14h.3a1 1 0 0 0 .7-1.7L16 9h.2a1 1 0 0 0 .8-1.7L13 3l-1.4 1.5"}]];var ms=[["path",{d:"m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"}],["path",{d:"M12 9v4"}],["path",{d:"M12 17h.01"}]];var wo=[["path",{d:"M10 14.66V17a1 1 0 0 1-1 1 2 2 0 0 0-2 2v2"}],["path",{d:"M14 14.66V17a1 1 0 0 0 1 1 2 2 0 0 1 2 2v2"}],["path",{d:"M17.916 10H19.5A2.5 2.5 0 0 0 22 7.5V5a1 1 0 0 0-1-1h-3"}],["path",{d:"M4 22h16"}],["path",{d:"M6 9a6 6 0 0 0 12 0V3a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1z"}],["path",{d:"M6.084 10H4.5A2.5 2.5 0 0 1 2 7.5V5a1 1 0 0 1 1-1h3"}]];var Eo=[["path",{d:"M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"}],["circle",{cx:"12",cy:"7",r:"4"}]];var To=[["path",{d:"M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"}],["path",{d:"M16 3.128a4 4 0 0 1 0 7.744"}],["path",{d:"M22 21v-2a4 4 0 0 0-3-3.87"}],["circle",{cx:"9",cy:"7",r:"4"}]];var Ao=[["rect",{width:"18",height:"18",x:"3",y:"3",rx:"2"}],["circle",{cx:"7.5",cy:"7.5",r:".5",fill:"currentColor"}],["path",{d:"m7.9 7.9 2.7 2.7"}],["circle",{cx:"16.5",cy:"7.5",r:".5",fill:"currentColor"}],["path",{d:"m13.4 10.6 2.7-2.7"}],["circle",{cx:"7.5",cy:"16.5",r:".5",fill:"currentColor"}],["path",{d:"m7.9 16.1 2.7-2.7"}],["circle",{cx:"16.5",cy:"16.5",r:".5",fill:"currentColor"}],["path",{d:"m13.4 13.4 2.7 2.7"}],["circle",{cx:"12",cy:"12",r:"2"}]];var Co=[["path",{d:"m9 12 2 2 4-4"}],["path",{d:"M5 7c0-1.1.9-2 2-2h10a2 2 0 0 1 2 2v12H5V7Z"}],["path",{d:"M22 19H2"}]];var Ro=[["path",{d:"M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"}],["path",{d:"M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"}]];var Po=[["path",{d:"M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.106-3.105c.32-.322.863-.22.983.218a6 6 0 0 1-8.259 7.057l-7.91 7.91a1 1 0 0 1-2.999-3l7.91-7.91a6 6 0 0 1 7.057-8.259c.438.12.54.662.219.984z"}]];var Io=[["path",{d:"M18 6 6 18"}],["path",{d:"m6 6 12 12"}]];var Lo=[["path",{d:"M15.914 4a1.5 1.5 0 00-2.474-1.561l-9 9A1.5 1.5 0 005.5 14h4.002a.5.5 0 01.471.666L8.086 20a1.5 1.5 0 002.475 1.56l9-9A1.5 1.5 0 0018.5 10h-3.997a.5.5 0 01-.472-.667z"}]];var Do=({icons:i={},nameAttr:e="data-lucide",attrs:t={},root:n=document,inTemplates:r}={})=>{if(!Object.values(i).length)throw new Error(`Please provide an icons object.
If you want to use all the icons you can import it like:
 \`import { createIcons, icons } from 'lucide';
lucide.createIcons({icons});\``);if(typeof n>"u")throw new Error("`createIcons()` only works in a browser environment.");if(Array.from(n.querySelectorAll(`[${e}]`)).forEach(a=>Va(a,{nameAttr:e,icons:i,attrs:t})),r&&Array.from(n.querySelectorAll("template")).forEach(o=>Do({icons:i,nameAttr:e,attrs:t,root:o.content,inTemplates:r})),e==="data-lucide"){let a=n.querySelectorAll("[icon-name]");a.length>0&&(console.warn("[Lucide] Some icons were found with the now deprecated icon-name attribute. These will still be replaced for backwards compatibility, but will no longer be supported in v1.0 and you should switch to data-lucide"),Array.from(a).forEach(o=>Va(o,{nameAttr:"icon-name",icons:i,attrs:t})))}};var zd={Menu:oo,Play:fo,Wallet:Ro,ShieldCheck:xo,Clock:qa,Hammer:eo,Landmark:no,X:Io,Check:Wa,Copy:$a,Send:go,Zap:Lo,Coins:Ya,Star:yo,MapPin:so,TrainFront:Mo,Vote:Co,TriangleAlert:ms,Sparkles:ps,LogOut:ro,User:Eo,BadgeCheck:us,Info:to,Factory:Ja,Radio:po,Trees:bo,Building2:fs,Anchor:Ga,Cpu:Za,Megaphone:ao,Wrench:Po,Newspaper:co,ChevronRight:Xa,Plus:ho,Minus:lo,CircleHelp:Ir,Trophy:wo,Users:To,Dice5:Ka,Flame:ja,Lock:io,RefreshCw:mo,Pause:uo,Gavel:Qa,Store:vo,House:ds,CircleCheck:hs,Siren:_o,Vault:Ao,Ticket:So};function zt(i=document){Do({icons:zd,attrs:{"stroke-width":2,"aria-hidden":"true"},root:i})}var gs=null,Bi=class extends Error{constructor(e,t,n){super(n),this.status=e,this.code=t}};function Hd(){let i=new Uint8Array(16);return crypto.getRandomValues(i),Array.from(i,e=>e.toString(16).padStart(2,"0")).join("")}async function Fi(i,e,t,n={}){let r=await fetch(e,{method:i,credentials:"same-origin",headers:{"Content-Type":"application/json",...gs?{"X-CSRF-Token":gs}:{},...n},body:t===void 0?void 0:JSON.stringify(t)}),s=null;try{s=await r.json()}catch{}if(s&&s.csrf&&(gs=s.csrf),!r.ok){let a=s&&s.error||{};throw new Bi(r.status,a.code||"error",a.message||"Something went wrong. Please try again.")}return s}var gt={async session(){let i=await Fi("GET","/api/session");return gs=i.csrf,i},get:i=>Fi("GET",i),post:(i,e)=>Fi("POST",i,e||{}),async action(i,e={},t=Hd()){try{return await Fi("POST",`/api/action/${i}`,e,{"Idempotency-Key":t})}catch(n){if(!(n instanceof Bi)||n.status>=502)return Fi("POST",`/api/action/${i}`,e,{"Idempotency-Key":t});if(n.code==="csrf"||n.code==="no_session")return await gt.session(),Fi("POST",`/api/action/${i}`,e,{"Idempotency-Key":t});throw n}}};function v(i,e={},...t){let n=document.createElement(i);for(let[r,s]of Object.entries(e||{}))if(!(s==null||s===!1))if(r==="class")n.className=s;else if(r==="style")for(let[a,o]of Object.entries(s))n.style.setProperty(a,o);else r.startsWith("on")?n.addEventListener(r.slice(2),s):r==="text"?n.textContent=s:n.setAttribute(r,s===!0?"":s);for(let r of t.flat())r==null||r===!1||n.append(r instanceof Node?r:document.createTextNode(String(r)));return n}var Te=i=>v("i",{"data-lucide":i}),ye=(i,e=document)=>e.querySelector(i),Uo=(i,e=document)=>[...e.querySelectorAll(i)];function lt(i){for(;i.firstChild;)i.removeChild(i.firstChild);return i}function Vd(i){let e=["#e2b33c","#c9972b","#8fb6dd","#9fd8b2","#f2a99e","#d9cba6","#b8d0e8","#f3d68f"],t=0;for(let n of String(i||"x"))t=t*31+n.charCodeAt(0)>>>0;return e[t%e.length]}function xs(i,e,t=""){return v("span",{class:`avatar ${t}`,style:{background:Vd(e||i)},title:i},(i||"?").slice(0,2).toUpperCase())}function Xu(i){let e=new Date(i);return`${String(e.getHours()).padStart(2,"0")}:${String(e.getMinutes()).padStart(2,"0")}`}var Ei={LEFT:0,MIDDLE:1,RIGHT:2,ROTATE:0,DOLLY:1,PAN:2},Ti={ROTATE:0,PAN:1,DOLLY_PAN:2,DOLLY_ROTATE:3},Gd=0,qu=1,Wd=2;var Qf=1,Ec=2,Pn=3,ei=0,Ot=1,In=2,jn=0,tr=1,Yu=2,$u=3,Zu=4,Xd=5,di=100,qd=101,Yd=102,$d=103,Zd=104,Kd=200,Jd=201,jd=202,Qd=203,ul=204,fl=205,ep=206,tp=207,np=208,ip=209,rp=210,sp=211,ap=212,op=213,lp=214,hl=0,dl=1,pl=2,sr=3,ml=4,gl=5,xl=6,_l=7,eh=0,cp=1,up=2,Qn=0,fp=1,hp=2,dp=3,Tc=4,pp=5,mp=6,gp=7;var th=300,ar=301,or=302,yl=303,vl=304,ma=306,Sl=1e3,gi=1001,Ml=1002,on=1003,xp=1004;var _s=1005;var mn=1006,No=1007;var xi=1008;var Nn=1009,nh=1010,ih=1011,Hr=1012,Ac=1013,_i=1014,Ln=1015,$r=1016,Cc=1017,Rc=1018,lr=1020,rh=35902,sh=1021,ah=1022,an=1023,oh=1024,lh=1025,nr=1026,cr=1027,ch=1028,Pc=1029,uh=1030,Ic=1031;var Lc=1033,zs=33776,Hs=33777,Vs=33778,Gs=33779,bl=35840,wl=35841,El=35842,Tl=35843,Al=36196,Cl=37492,Rl=37496,Pl=37808,Il=37809,Ll=37810,Dl=37811,Ul=37812,Nl=37813,Ol=37814,Fl=37815,Bl=37816,kl=37817,zl=37818,Hl=37819,Vl=37820,Gl=37821,Ws=36492,Wl=36494,Xl=36495,fh=36283,ql=36284,Yl=36285,$l=36286;var Xs=2300,Zl=2301,Oo=2302,Ku=2400,Ju=2401,ju=2402;var _p=3200,yp=3201;var hh=0,vp=1,Jn="",bt="srgb",mr="srgb-linear",ga="linear",je="srgb";var ki=7680;var Qu=519,Sp=512,Mp=513,bp=514,dh=515,wp=516,Ep=517,Tp=518,Ap=519,ef=35044;var tf="300 es",Dn=2e3,qs=2001,On=class{addEventListener(e,t){this._listeners===void 0&&(this._listeners={});let n=this._listeners;n[e]===void 0&&(n[e]=[]),n[e].indexOf(t)===-1&&n[e].push(t)}hasEventListener(e,t){if(this._listeners===void 0)return!1;let n=this._listeners;return n[e]!==void 0&&n[e].indexOf(t)!==-1}removeEventListener(e,t){if(this._listeners===void 0)return;let r=this._listeners[e];if(r!==void 0){let s=r.indexOf(t);s!==-1&&r.splice(s,1)}}dispatchEvent(e){if(this._listeners===void 0)return;let n=this._listeners[e.type];if(n!==void 0){e.target=this;let r=n.slice(0);for(let s=0,a=r.length;s<a;s++)r[s].call(this,e);e.target=null}}},Ct=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"],nf=1234567,Br=Math.PI/180,Vr=180/Math.PI;function gr(){let i=Math.random()*4294967295|0,e=Math.random()*4294967295|0,t=Math.random()*4294967295|0,n=Math.random()*4294967295|0;return(Ct[i&255]+Ct[i>>8&255]+Ct[i>>16&255]+Ct[i>>24&255]+"-"+Ct[e&255]+Ct[e>>8&255]+"-"+Ct[e>>16&15|64]+Ct[e>>24&255]+"-"+Ct[t&63|128]+Ct[t>>8&255]+"-"+Ct[t>>16&255]+Ct[t>>24&255]+Ct[n&255]+Ct[n>>8&255]+Ct[n>>16&255]+Ct[n>>24&255]).toLowerCase()}function Tt(i,e,t){return Math.max(e,Math.min(t,i))}function Dc(i,e){return(i%e+e)%e}function Cp(i,e,t,n,r){return n+(i-e)*(r-n)/(t-e)}function Rp(i,e,t){return i!==e?(t-i)/(e-i):0}function kr(i,e,t){return(1-t)*i+t*e}function Pp(i,e,t,n){return kr(i,e,1-Math.exp(-t*n))}function Ip(i,e=1){return e-Math.abs(Dc(i,e*2)-e)}function Lp(i,e,t){return i<=e?0:i>=t?1:(i=(i-e)/(t-e),i*i*(3-2*i))}function Dp(i,e,t){return i<=e?0:i>=t?1:(i=(i-e)/(t-e),i*i*i*(i*(i*6-15)+10))}function Up(i,e){return i+Math.floor(Math.random()*(e-i+1))}function Np(i,e){return i+Math.random()*(e-i)}function Op(i){return i*(.5-Math.random())}function Fp(i){i!==void 0&&(nf=i);let e=nf+=1831565813;return e=Math.imul(e^e>>>15,e|1),e^=e+Math.imul(e^e>>>7,e|61),((e^e>>>14)>>>0)/4294967296}function Bp(i){return i*Br}function kp(i){return i*Vr}function zp(i){return(i&i-1)===0&&i!==0}function Hp(i){return Math.pow(2,Math.ceil(Math.log(i)/Math.LN2))}function Vp(i){return Math.pow(2,Math.floor(Math.log(i)/Math.LN2))}function Gp(i,e,t,n,r){let s=Math.cos,a=Math.sin,o=s(t/2),l=a(t/2),c=s((e+n)/2),u=a((e+n)/2),f=s((e-n)/2),d=a((e-n)/2),p=s((n-e)/2),g=a((n-e)/2);switch(r){case"XYX":i.set(o*u,l*f,l*d,o*c);break;case"YZY":i.set(l*d,o*u,l*f,o*c);break;case"ZXZ":i.set(l*f,l*d,o*u,o*c);break;case"XZX":i.set(o*u,l*g,l*p,o*c);break;case"YXY":i.set(l*p,o*u,l*g,o*c);break;case"ZYZ":i.set(l*g,l*p,o*u,o*c);break;default:console.warn("THREE.MathUtils: .setQuaternionFromProperEuler() encountered an unknown order: "+r)}}function Qi(i,e){switch(e.constructor){case Float32Array:return i;case Uint32Array:return i/4294967295;case Uint16Array:return i/65535;case Uint8Array:return i/255;case Int32Array:return Math.max(i/2147483647,-1);case Int16Array:return Math.max(i/32767,-1);case Int8Array:return Math.max(i/127,-1);default:throw new Error("Invalid component type.")}}function It(i,e){switch(e.constructor){case Float32Array:return i;case Uint32Array:return Math.round(i*4294967295);case Uint16Array:return Math.round(i*65535);case Uint8Array:return Math.round(i*255);case Int32Array:return Math.round(i*2147483647);case Int16Array:return Math.round(i*32767);case Int8Array:return Math.round(i*127);default:throw new Error("Invalid component type.")}}var ph={DEG2RAD:Br,RAD2DEG:Vr,generateUUID:gr,clamp:Tt,euclideanModulo:Dc,mapLinear:Cp,inverseLerp:Rp,lerp:kr,damp:Pp,pingpong:Ip,smoothstep:Lp,smootherstep:Dp,randInt:Up,randFloat:Np,randFloatSpread:Op,seededRandom:Fp,degToRad:Bp,radToDeg:kp,isPowerOfTwo:zp,ceilPowerOfTwo:Hp,floorPowerOfTwo:Vp,setQuaternionFromProperEuler:Gp,normalize:It,denormalize:Qi},we=class i{constructor(e=0,t=0){i.prototype.isVector2=!0,this.x=e,this.y=t}get width(){return this.x}set width(e){this.x=e}get height(){return this.y}set height(e){this.y=e}set(e,t){return this.x=e,this.y=t,this}setScalar(e){return this.x=e,this.y=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y)}copy(e){return this.x=e.x,this.y=e.y,this}add(e){return this.x+=e.x,this.y+=e.y,this}addScalar(e){return this.x+=e,this.y+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this}subScalar(e){return this.x-=e,this.y-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this}multiply(e){return this.x*=e.x,this.y*=e.y,this}multiplyScalar(e){return this.x*=e,this.y*=e,this}divide(e){return this.x/=e.x,this.y/=e.y,this}divideScalar(e){return this.multiplyScalar(1/e)}applyMatrix3(e){let t=this.x,n=this.y,r=e.elements;return this.x=r[0]*t+r[3]*n+r[6],this.y=r[1]*t+r[4]*n+r[7],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this}clamp(e,t){return this.x=Math.max(e.x,Math.min(t.x,this.x)),this.y=Math.max(e.y,Math.min(t.y,this.y)),this}clampScalar(e,t){return this.x=Math.max(e,Math.min(t,this.x)),this.y=Math.max(e,Math.min(t,this.y)),this}clampLength(e,t){let n=this.length();return this.divideScalar(n||1).multiplyScalar(Math.max(e,Math.min(t,n)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(e){return this.x*e.x+this.y*e.y}cross(e){return this.x*e.y-this.y*e.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(e){let t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;let n=this.dot(e)/t;return Math.acos(Tt(n,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){let t=this.x-e.x,n=this.y-e.y;return t*t+n*n}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this}equals(e){return e.x===this.x&&e.y===this.y}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this}rotateAround(e,t){let n=Math.cos(t),r=Math.sin(t),s=this.x-e.x,a=this.y-e.y;return this.x=s*n-a*r+e.x,this.y=s*r+a*n+e.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}},Ne=class i{constructor(e,t,n,r,s,a,o,l,c){i.prototype.isMatrix3=!0,this.elements=[1,0,0,0,1,0,0,0,1],e!==void 0&&this.set(e,t,n,r,s,a,o,l,c)}set(e,t,n,r,s,a,o,l,c){let u=this.elements;return u[0]=e,u[1]=r,u[2]=o,u[3]=t,u[4]=s,u[5]=l,u[6]=n,u[7]=a,u[8]=c,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(e){let t=this.elements,n=e.elements;return t[0]=n[0],t[1]=n[1],t[2]=n[2],t[3]=n[3],t[4]=n[4],t[5]=n[5],t[6]=n[6],t[7]=n[7],t[8]=n[8],this}extractBasis(e,t,n){return e.setFromMatrix3Column(this,0),t.setFromMatrix3Column(this,1),n.setFromMatrix3Column(this,2),this}setFromMatrix4(e){let t=e.elements;return this.set(t[0],t[4],t[8],t[1],t[5],t[9],t[2],t[6],t[10]),this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){let n=e.elements,r=t.elements,s=this.elements,a=n[0],o=n[3],l=n[6],c=n[1],u=n[4],f=n[7],d=n[2],p=n[5],g=n[8],_=r[0],m=r[3],h=r[6],T=r[1],w=r[4],M=r[7],N=r[2],A=r[5],C=r[8];return s[0]=a*_+o*T+l*N,s[3]=a*m+o*w+l*A,s[6]=a*h+o*M+l*C,s[1]=c*_+u*T+f*N,s[4]=c*m+u*w+f*A,s[7]=c*h+u*M+f*C,s[2]=d*_+p*T+g*N,s[5]=d*m+p*w+g*A,s[8]=d*h+p*M+g*C,this}multiplyScalar(e){let t=this.elements;return t[0]*=e,t[3]*=e,t[6]*=e,t[1]*=e,t[4]*=e,t[7]*=e,t[2]*=e,t[5]*=e,t[8]*=e,this}determinant(){let e=this.elements,t=e[0],n=e[1],r=e[2],s=e[3],a=e[4],o=e[5],l=e[6],c=e[7],u=e[8];return t*a*u-t*o*c-n*s*u+n*o*l+r*s*c-r*a*l}invert(){let e=this.elements,t=e[0],n=e[1],r=e[2],s=e[3],a=e[4],o=e[5],l=e[6],c=e[7],u=e[8],f=u*a-o*c,d=o*l-u*s,p=c*s-a*l,g=t*f+n*d+r*p;if(g===0)return this.set(0,0,0,0,0,0,0,0,0);let _=1/g;return e[0]=f*_,e[1]=(r*c-u*n)*_,e[2]=(o*n-r*a)*_,e[3]=d*_,e[4]=(u*t-r*l)*_,e[5]=(r*s-o*t)*_,e[6]=p*_,e[7]=(n*l-c*t)*_,e[8]=(a*t-n*s)*_,this}transpose(){let e,t=this.elements;return e=t[1],t[1]=t[3],t[3]=e,e=t[2],t[2]=t[6],t[6]=e,e=t[5],t[5]=t[7],t[7]=e,this}getNormalMatrix(e){return this.setFromMatrix4(e).invert().transpose()}transposeIntoArray(e){let t=this.elements;return e[0]=t[0],e[1]=t[3],e[2]=t[6],e[3]=t[1],e[4]=t[4],e[5]=t[7],e[6]=t[2],e[7]=t[5],e[8]=t[8],this}setUvTransform(e,t,n,r,s,a,o){let l=Math.cos(s),c=Math.sin(s);return this.set(n*l,n*c,-n*(l*a+c*o)+a+e,-r*c,r*l,-r*(-c*a+l*o)+o+t,0,0,1),this}scale(e,t){return this.premultiply(Fo.makeScale(e,t)),this}rotate(e){return this.premultiply(Fo.makeRotation(-e)),this}translate(e,t){return this.premultiply(Fo.makeTranslation(e,t)),this}makeTranslation(e,t){return e.isVector2?this.set(1,0,e.x,0,1,e.y,0,0,1):this.set(1,0,e,0,1,t,0,0,1),this}makeRotation(e){let t=Math.cos(e),n=Math.sin(e);return this.set(t,-n,0,n,t,0,0,0,1),this}makeScale(e,t){return this.set(e,0,0,0,t,0,0,0,1),this}equals(e){let t=this.elements,n=e.elements;for(let r=0;r<9;r++)if(t[r]!==n[r])return!1;return!0}fromArray(e,t=0){for(let n=0;n<9;n++)this.elements[n]=e[n+t];return this}toArray(e=[],t=0){let n=this.elements;return e[t]=n[0],e[t+1]=n[1],e[t+2]=n[2],e[t+3]=n[3],e[t+4]=n[4],e[t+5]=n[5],e[t+6]=n[6],e[t+7]=n[7],e[t+8]=n[8],e}clone(){return new this.constructor().fromArray(this.elements)}},Fo=new Ne;function mh(i){for(let e=i.length-1;e>=0;--e)if(i[e]>=65535)return!0;return!1}function Ys(i){return document.createElementNS("http://www.w3.org/1999/xhtml",i)}function Wp(){let i=Ys("canvas");return i.style.display="block",i}var rf={};function Or(i){i in rf||(rf[i]=!0,console.warn(i))}function Xp(i,e,t){return new Promise(function(n,r){function s(){switch(i.clientWaitSync(e,i.SYNC_FLUSH_COMMANDS_BIT,0)){case i.WAIT_FAILED:r();break;case i.TIMEOUT_EXPIRED:setTimeout(s,t);break;default:n()}}setTimeout(s,t)})}function qp(i){let e=i.elements;e[2]=.5*e[2]+.5*e[3],e[6]=.5*e[6]+.5*e[7],e[10]=.5*e[10]+.5*e[11],e[14]=.5*e[14]+.5*e[15]}function Yp(i){let e=i.elements;e[11]===-1?(e[10]=-e[10]-1,e[14]=-e[14]):(e[10]=-e[10],e[14]=-e[14]+1)}var Ye={enabled:!0,workingColorSpace:mr,spaces:{},convert:function(i,e,t){return this.enabled===!1||e===t||!e||!t||(this.spaces[e].transfer===je&&(i.r=Un(i.r),i.g=Un(i.g),i.b=Un(i.b)),this.spaces[e].primaries!==this.spaces[t].primaries&&(i.applyMatrix3(this.spaces[e].toXYZ),i.applyMatrix3(this.spaces[t].fromXYZ)),this.spaces[t].transfer===je&&(i.r=ir(i.r),i.g=ir(i.g),i.b=ir(i.b))),i},fromWorkingColorSpace:function(i,e){return this.convert(i,this.workingColorSpace,e)},toWorkingColorSpace:function(i,e){return this.convert(i,e,this.workingColorSpace)},getPrimaries:function(i){return this.spaces[i].primaries},getTransfer:function(i){return i===Jn?ga:this.spaces[i].transfer},getLuminanceCoefficients:function(i,e=this.workingColorSpace){return i.fromArray(this.spaces[e].luminanceCoefficients)},define:function(i){Object.assign(this.spaces,i)},_getMatrix:function(i,e,t){return i.copy(this.spaces[e].toXYZ).multiply(this.spaces[t].fromXYZ)},_getDrawingBufferColorSpace:function(i){return this.spaces[i].outputColorSpaceConfig.drawingBufferColorSpace},_getUnpackColorSpace:function(i=this.workingColorSpace){return this.spaces[i].workingColorSpaceConfig.unpackColorSpace}};function Un(i){return i<.04045?i*.0773993808:Math.pow(i*.9478672986+.0521327014,2.4)}function ir(i){return i<.0031308?i*12.92:1.055*Math.pow(i,.41666)-.055}var sf=[.64,.33,.3,.6,.15,.06],af=[.2126,.7152,.0722],of=[.3127,.329],lf=new Ne().set(.4123908,.3575843,.1804808,.212639,.7151687,.0721923,.0193308,.1191948,.9505322),cf=new Ne().set(3.2409699,-1.5373832,-.4986108,-.9692436,1.8759675,.0415551,.0556301,-.203977,1.0569715);Ye.define({[mr]:{primaries:sf,whitePoint:of,transfer:ga,toXYZ:lf,fromXYZ:cf,luminanceCoefficients:af,workingColorSpaceConfig:{unpackColorSpace:bt},outputColorSpaceConfig:{drawingBufferColorSpace:bt}},[bt]:{primaries:sf,whitePoint:of,transfer:je,toXYZ:lf,fromXYZ:cf,luminanceCoefficients:af,outputColorSpaceConfig:{drawingBufferColorSpace:bt}}});var zi,Kl=class{static getDataURL(e){if(/^data:/i.test(e.src)||typeof HTMLCanvasElement>"u")return e.src;let t;if(e instanceof HTMLCanvasElement)t=e;else{zi===void 0&&(zi=Ys("canvas")),zi.width=e.width,zi.height=e.height;let n=zi.getContext("2d");e instanceof ImageData?n.putImageData(e,0,0):n.drawImage(e,0,0,e.width,e.height),t=zi}return t.width>2048||t.height>2048?(console.warn("THREE.ImageUtils.getDataURL: Image converted to jpg for performance reasons",e),t.toDataURL("image/jpeg",.6)):t.toDataURL("image/png")}static sRGBToLinear(e){if(typeof HTMLImageElement<"u"&&e instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&e instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&e instanceof ImageBitmap){let t=Ys("canvas");t.width=e.width,t.height=e.height;let n=t.getContext("2d");n.drawImage(e,0,0,e.width,e.height);let r=n.getImageData(0,0,e.width,e.height),s=r.data;for(let a=0;a<s.length;a++)s[a]=Un(s[a]/255)*255;return n.putImageData(r,0,0),t}else if(e.data){let t=e.data.slice(0);for(let n=0;n<t.length;n++)t instanceof Uint8Array||t instanceof Uint8ClampedArray?t[n]=Math.floor(Un(t[n]/255)*255):t[n]=Un(t[n]);return{data:t,width:e.width,height:e.height}}else return console.warn("THREE.ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),e}},$p=0,$s=class{constructor(e=null){this.isSource=!0,Object.defineProperty(this,"id",{value:$p++}),this.uuid=gr(),this.data=e,this.dataReady=!0,this.version=0}set needsUpdate(e){e===!0&&this.version++}toJSON(e){let t=e===void 0||typeof e=="string";if(!t&&e.images[this.uuid]!==void 0)return e.images[this.uuid];let n={uuid:this.uuid,url:""},r=this.data;if(r!==null){let s;if(Array.isArray(r)){s=[];for(let a=0,o=r.length;a<o;a++)r[a].isDataTexture?s.push(Bo(r[a].image)):s.push(Bo(r[a]))}else s=Bo(r);n.url=s}return t||(e.images[this.uuid]=n),n}};function Bo(i){return typeof HTMLImageElement<"u"&&i instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&i instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&i instanceof ImageBitmap?Kl.getDataURL(i):i.data?{data:Array.from(i.data),width:i.width,height:i.height,type:i.data.constructor.name}:(console.warn("THREE.Texture: Unable to serialize Texture."),{})}var Zp=0,Gt=class i extends On{constructor(e=i.DEFAULT_IMAGE,t=i.DEFAULT_MAPPING,n=gi,r=gi,s=mn,a=xi,o=an,l=Nn,c=i.DEFAULT_ANISOTROPY,u=Jn){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:Zp++}),this.uuid=gr(),this.name="",this.source=new $s(e),this.mipmaps=[],this.mapping=t,this.channel=0,this.wrapS=n,this.wrapT=r,this.magFilter=s,this.minFilter=a,this.anisotropy=c,this.format=o,this.internalFormat=null,this.type=l,this.offset=new we(0,0),this.repeat=new we(1,1),this.center=new we(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new Ne,this.generateMipmaps=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.colorSpace=u,this.userData={},this.version=0,this.onUpdate=null,this.isRenderTargetTexture=!1,this.pmremVersion=0}get image(){return this.source.data}set image(e=null){this.source.data=e}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}clone(){return new this.constructor().copy(this)}copy(e){return this.name=e.name,this.source=e.source,this.mipmaps=e.mipmaps.slice(0),this.mapping=e.mapping,this.channel=e.channel,this.wrapS=e.wrapS,this.wrapT=e.wrapT,this.magFilter=e.magFilter,this.minFilter=e.minFilter,this.anisotropy=e.anisotropy,this.format=e.format,this.internalFormat=e.internalFormat,this.type=e.type,this.offset.copy(e.offset),this.repeat.copy(e.repeat),this.center.copy(e.center),this.rotation=e.rotation,this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrix.copy(e.matrix),this.generateMipmaps=e.generateMipmaps,this.premultiplyAlpha=e.premultiplyAlpha,this.flipY=e.flipY,this.unpackAlignment=e.unpackAlignment,this.colorSpace=e.colorSpace,this.userData=JSON.parse(JSON.stringify(e.userData)),this.needsUpdate=!0,this}toJSON(e){let t=e===void 0||typeof e=="string";if(!t&&e.textures[this.uuid]!==void 0)return e.textures[this.uuid];let n={metadata:{version:4.6,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(e).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(n.userData=this.userData),t||(e.textures[this.uuid]=n),n}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(e){if(this.mapping!==th)return e;if(e.applyMatrix3(this.matrix),e.x<0||e.x>1)switch(this.wrapS){case Sl:e.x=e.x-Math.floor(e.x);break;case gi:e.x=e.x<0?0:1;break;case Ml:Math.abs(Math.floor(e.x)%2)===1?e.x=Math.ceil(e.x)-e.x:e.x=e.x-Math.floor(e.x);break}if(e.y<0||e.y>1)switch(this.wrapT){case Sl:e.y=e.y-Math.floor(e.y);break;case gi:e.y=e.y<0?0:1;break;case Ml:Math.abs(Math.floor(e.y)%2)===1?e.y=Math.ceil(e.y)-e.y:e.y=e.y-Math.floor(e.y);break}return this.flipY&&(e.y=1-e.y),e}set needsUpdate(e){e===!0&&(this.version++,this.source.needsUpdate=!0)}set needsPMREMUpdate(e){e===!0&&this.pmremVersion++}};Gt.DEFAULT_IMAGE=null;Gt.DEFAULT_MAPPING=th;Gt.DEFAULT_ANISOTROPY=1;var ht=class i{constructor(e=0,t=0,n=0,r=1){i.prototype.isVector4=!0,this.x=e,this.y=t,this.z=n,this.w=r}get width(){return this.z}set width(e){this.z=e}get height(){return this.w}set height(e){this.w=e}set(e,t,n,r){return this.x=e,this.y=t,this.z=n,this.w=r,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this.w=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setW(e){return this.w=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;case 3:this.w=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this.w=e.w!==void 0?e.w:1,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this.w+=e.w,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this.w+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this.w=e.w+t.w,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this.w+=e.w*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this.w-=e.w,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this.w-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this.w=e.w-t.w,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this.w*=e.w,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this.w*=e,this}applyMatrix4(e){let t=this.x,n=this.y,r=this.z,s=this.w,a=e.elements;return this.x=a[0]*t+a[4]*n+a[8]*r+a[12]*s,this.y=a[1]*t+a[5]*n+a[9]*r+a[13]*s,this.z=a[2]*t+a[6]*n+a[10]*r+a[14]*s,this.w=a[3]*t+a[7]*n+a[11]*r+a[15]*s,this}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this.w/=e.w,this}divideScalar(e){return this.multiplyScalar(1/e)}setAxisAngleFromQuaternion(e){this.w=2*Math.acos(e.w);let t=Math.sqrt(1-e.w*e.w);return t<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=e.x/t,this.y=e.y/t,this.z=e.z/t),this}setAxisAngleFromRotationMatrix(e){let t,n,r,s,l=e.elements,c=l[0],u=l[4],f=l[8],d=l[1],p=l[5],g=l[9],_=l[2],m=l[6],h=l[10];if(Math.abs(u-d)<.01&&Math.abs(f-_)<.01&&Math.abs(g-m)<.01){if(Math.abs(u+d)<.1&&Math.abs(f+_)<.1&&Math.abs(g+m)<.1&&Math.abs(c+p+h-3)<.1)return this.set(1,0,0,0),this;t=Math.PI;let w=(c+1)/2,M=(p+1)/2,N=(h+1)/2,A=(u+d)/4,C=(f+_)/4,D=(g+m)/4;return w>M&&w>N?w<.01?(n=0,r=.707106781,s=.707106781):(n=Math.sqrt(w),r=A/n,s=C/n):M>N?M<.01?(n=.707106781,r=0,s=.707106781):(r=Math.sqrt(M),n=A/r,s=D/r):N<.01?(n=.707106781,r=.707106781,s=0):(s=Math.sqrt(N),n=C/s,r=D/s),this.set(n,r,s,t),this}let T=Math.sqrt((m-g)*(m-g)+(f-_)*(f-_)+(d-u)*(d-u));return Math.abs(T)<.001&&(T=1),this.x=(m-g)/T,this.y=(f-_)/T,this.z=(d-u)/T,this.w=Math.acos((c+p+h-1)/2),this}setFromMatrixPosition(e){let t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this.w=t[15],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this.w=Math.min(this.w,e.w),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this.w=Math.max(this.w,e.w),this}clamp(e,t){return this.x=Math.max(e.x,Math.min(t.x,this.x)),this.y=Math.max(e.y,Math.min(t.y,this.y)),this.z=Math.max(e.z,Math.min(t.z,this.z)),this.w=Math.max(e.w,Math.min(t.w,this.w)),this}clampScalar(e,t){return this.x=Math.max(e,Math.min(t,this.x)),this.y=Math.max(e,Math.min(t,this.y)),this.z=Math.max(e,Math.min(t,this.z)),this.w=Math.max(e,Math.min(t,this.w)),this}clampLength(e,t){let n=this.length();return this.divideScalar(n||1).multiplyScalar(Math.max(e,Math.min(t,n)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z+this.w*e.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this.w+=(e.w-this.w)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this.z=e.z+(t.z-e.z)*n,this.w=e.w+(t.w-e.w)*n,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z&&e.w===this.w}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this.w=e[t+3],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e[t+3]=this.w,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this.w=e.getW(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}},Jl=class extends On{constructor(e=1,t=1,n={}){super(),this.isRenderTarget=!0,this.width=e,this.height=t,this.depth=1,this.scissor=new ht(0,0,e,t),this.scissorTest=!1,this.viewport=new ht(0,0,e,t);let r={width:e,height:t,depth:1};n=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:mn,depthBuffer:!0,stencilBuffer:!1,resolveDepthBuffer:!0,resolveStencilBuffer:!0,depthTexture:null,samples:0,count:1},n);let s=new Gt(r,n.mapping,n.wrapS,n.wrapT,n.magFilter,n.minFilter,n.format,n.type,n.anisotropy,n.colorSpace);s.flipY=!1,s.generateMipmaps=n.generateMipmaps,s.internalFormat=n.internalFormat,this.textures=[];let a=n.count;for(let o=0;o<a;o++)this.textures[o]=s.clone(),this.textures[o].isRenderTargetTexture=!0;this.depthBuffer=n.depthBuffer,this.stencilBuffer=n.stencilBuffer,this.resolveDepthBuffer=n.resolveDepthBuffer,this.resolveStencilBuffer=n.resolveStencilBuffer,this.depthTexture=n.depthTexture,this.samples=n.samples}get texture(){return this.textures[0]}set texture(e){this.textures[0]=e}setSize(e,t,n=1){if(this.width!==e||this.height!==t||this.depth!==n){this.width=e,this.height=t,this.depth=n;for(let r=0,s=this.textures.length;r<s;r++)this.textures[r].image.width=e,this.textures[r].image.height=t,this.textures[r].image.depth=n;this.dispose()}this.viewport.set(0,0,e,t),this.scissor.set(0,0,e,t)}clone(){return new this.constructor().copy(this)}copy(e){this.width=e.width,this.height=e.height,this.depth=e.depth,this.scissor.copy(e.scissor),this.scissorTest=e.scissorTest,this.viewport.copy(e.viewport),this.textures.length=0;for(let n=0,r=e.textures.length;n<r;n++)this.textures[n]=e.textures[n].clone(),this.textures[n].isRenderTargetTexture=!0;let t=Object.assign({},e.texture.image);return this.texture.source=new $s(t),this.depthBuffer=e.depthBuffer,this.stencilBuffer=e.stencilBuffer,this.resolveDepthBuffer=e.resolveDepthBuffer,this.resolveStencilBuffer=e.resolveStencilBuffer,e.depthTexture!==null&&(this.depthTexture=e.depthTexture.clone()),this.samples=e.samples,this}dispose(){this.dispatchEvent({type:"dispose"})}},Fn=class extends Jl{constructor(e=1,t=1,n={}){super(e,t,n),this.isWebGLRenderTarget=!0}},Zs=class extends Gt{constructor(e=null,t=1,n=1,r=1){super(null),this.isDataArrayTexture=!0,this.image={data:e,width:t,height:n,depth:r},this.magFilter=on,this.minFilter=on,this.wrapR=gi,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1,this.layerUpdates=new Set}addLayerUpdate(e){this.layerUpdates.add(e)}clearLayerUpdates(){this.layerUpdates.clear()}};var jl=class extends Gt{constructor(e=null,t=1,n=1,r=1){super(null),this.isData3DTexture=!0,this.image={data:e,width:t,height:n,depth:r},this.magFilter=on,this.minFilter=on,this.wrapR=gi,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}};var ln=class{constructor(e=0,t=0,n=0,r=1){this.isQuaternion=!0,this._x=e,this._y=t,this._z=n,this._w=r}static slerpFlat(e,t,n,r,s,a,o){let l=n[r+0],c=n[r+1],u=n[r+2],f=n[r+3],d=s[a+0],p=s[a+1],g=s[a+2],_=s[a+3];if(o===0){e[t+0]=l,e[t+1]=c,e[t+2]=u,e[t+3]=f;return}if(o===1){e[t+0]=d,e[t+1]=p,e[t+2]=g,e[t+3]=_;return}if(f!==_||l!==d||c!==p||u!==g){let m=1-o,h=l*d+c*p+u*g+f*_,T=h>=0?1:-1,w=1-h*h;if(w>Number.EPSILON){let N=Math.sqrt(w),A=Math.atan2(N,h*T);m=Math.sin(m*A)/N,o=Math.sin(o*A)/N}let M=o*T;if(l=l*m+d*M,c=c*m+p*M,u=u*m+g*M,f=f*m+_*M,m===1-o){let N=1/Math.sqrt(l*l+c*c+u*u+f*f);l*=N,c*=N,u*=N,f*=N}}e[t]=l,e[t+1]=c,e[t+2]=u,e[t+3]=f}static multiplyQuaternionsFlat(e,t,n,r,s,a){let o=n[r],l=n[r+1],c=n[r+2],u=n[r+3],f=s[a],d=s[a+1],p=s[a+2],g=s[a+3];return e[t]=o*g+u*f+l*p-c*d,e[t+1]=l*g+u*d+c*f-o*p,e[t+2]=c*g+u*p+o*d-l*f,e[t+3]=u*g-o*f-l*d-c*p,e}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get w(){return this._w}set w(e){this._w=e,this._onChangeCallback()}set(e,t,n,r){return this._x=e,this._y=t,this._z=n,this._w=r,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(e){return this._x=e.x,this._y=e.y,this._z=e.z,this._w=e.w,this._onChangeCallback(),this}setFromEuler(e,t=!0){let n=e._x,r=e._y,s=e._z,a=e._order,o=Math.cos,l=Math.sin,c=o(n/2),u=o(r/2),f=o(s/2),d=l(n/2),p=l(r/2),g=l(s/2);switch(a){case"XYZ":this._x=d*u*f+c*p*g,this._y=c*p*f-d*u*g,this._z=c*u*g+d*p*f,this._w=c*u*f-d*p*g;break;case"YXZ":this._x=d*u*f+c*p*g,this._y=c*p*f-d*u*g,this._z=c*u*g-d*p*f,this._w=c*u*f+d*p*g;break;case"ZXY":this._x=d*u*f-c*p*g,this._y=c*p*f+d*u*g,this._z=c*u*g+d*p*f,this._w=c*u*f-d*p*g;break;case"ZYX":this._x=d*u*f-c*p*g,this._y=c*p*f+d*u*g,this._z=c*u*g-d*p*f,this._w=c*u*f+d*p*g;break;case"YZX":this._x=d*u*f+c*p*g,this._y=c*p*f+d*u*g,this._z=c*u*g-d*p*f,this._w=c*u*f-d*p*g;break;case"XZY":this._x=d*u*f-c*p*g,this._y=c*p*f-d*u*g,this._z=c*u*g+d*p*f,this._w=c*u*f+d*p*g;break;default:console.warn("THREE.Quaternion: .setFromEuler() encountered an unknown order: "+a)}return t===!0&&this._onChangeCallback(),this}setFromAxisAngle(e,t){let n=t/2,r=Math.sin(n);return this._x=e.x*r,this._y=e.y*r,this._z=e.z*r,this._w=Math.cos(n),this._onChangeCallback(),this}setFromRotationMatrix(e){let t=e.elements,n=t[0],r=t[4],s=t[8],a=t[1],o=t[5],l=t[9],c=t[2],u=t[6],f=t[10],d=n+o+f;if(d>0){let p=.5/Math.sqrt(d+1);this._w=.25/p,this._x=(u-l)*p,this._y=(s-c)*p,this._z=(a-r)*p}else if(n>o&&n>f){let p=2*Math.sqrt(1+n-o-f);this._w=(u-l)/p,this._x=.25*p,this._y=(r+a)/p,this._z=(s+c)/p}else if(o>f){let p=2*Math.sqrt(1+o-n-f);this._w=(s-c)/p,this._x=(r+a)/p,this._y=.25*p,this._z=(l+u)/p}else{let p=2*Math.sqrt(1+f-n-o);this._w=(a-r)/p,this._x=(s+c)/p,this._y=(l+u)/p,this._z=.25*p}return this._onChangeCallback(),this}setFromUnitVectors(e,t){let n=e.dot(t)+1;return n<Number.EPSILON?(n=0,Math.abs(e.x)>Math.abs(e.z)?(this._x=-e.y,this._y=e.x,this._z=0,this._w=n):(this._x=0,this._y=-e.z,this._z=e.y,this._w=n)):(this._x=e.y*t.z-e.z*t.y,this._y=e.z*t.x-e.x*t.z,this._z=e.x*t.y-e.y*t.x,this._w=n),this.normalize()}angleTo(e){return 2*Math.acos(Math.abs(Tt(this.dot(e),-1,1)))}rotateTowards(e,t){let n=this.angleTo(e);if(n===0)return this;let r=Math.min(1,t/n);return this.slerp(e,r),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(e){return this._x*e._x+this._y*e._y+this._z*e._z+this._w*e._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let e=this.length();return e===0?(this._x=0,this._y=0,this._z=0,this._w=1):(e=1/e,this._x=this._x*e,this._y=this._y*e,this._z=this._z*e,this._w=this._w*e),this._onChangeCallback(),this}multiply(e){return this.multiplyQuaternions(this,e)}premultiply(e){return this.multiplyQuaternions(e,this)}multiplyQuaternions(e,t){let n=e._x,r=e._y,s=e._z,a=e._w,o=t._x,l=t._y,c=t._z,u=t._w;return this._x=n*u+a*o+r*c-s*l,this._y=r*u+a*l+s*o-n*c,this._z=s*u+a*c+n*l-r*o,this._w=a*u-n*o-r*l-s*c,this._onChangeCallback(),this}slerp(e,t){if(t===0)return this;if(t===1)return this.copy(e);let n=this._x,r=this._y,s=this._z,a=this._w,o=a*e._w+n*e._x+r*e._y+s*e._z;if(o<0?(this._w=-e._w,this._x=-e._x,this._y=-e._y,this._z=-e._z,o=-o):this.copy(e),o>=1)return this._w=a,this._x=n,this._y=r,this._z=s,this;let l=1-o*o;if(l<=Number.EPSILON){let p=1-t;return this._w=p*a+t*this._w,this._x=p*n+t*this._x,this._y=p*r+t*this._y,this._z=p*s+t*this._z,this.normalize(),this}let c=Math.sqrt(l),u=Math.atan2(c,o),f=Math.sin((1-t)*u)/c,d=Math.sin(t*u)/c;return this._w=a*f+this._w*d,this._x=n*f+this._x*d,this._y=r*f+this._y*d,this._z=s*f+this._z*d,this._onChangeCallback(),this}slerpQuaternions(e,t,n){return this.copy(e).slerp(t,n)}random(){let e=2*Math.PI*Math.random(),t=2*Math.PI*Math.random(),n=Math.random(),r=Math.sqrt(1-n),s=Math.sqrt(n);return this.set(r*Math.sin(e),r*Math.cos(e),s*Math.sin(t),s*Math.cos(t))}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._w===this._w}fromArray(e,t=0){return this._x=e[t],this._y=e[t+1],this._z=e[t+2],this._w=e[t+3],this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._w,e}fromBufferAttribute(e,t){return this._x=e.getX(t),this._y=e.getY(t),this._z=e.getZ(t),this._w=e.getW(t),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}},O=class i{constructor(e=0,t=0,n=0){i.prototype.isVector3=!0,this.x=e,this.y=t,this.z=n}set(e,t,n){return n===void 0&&(n=this.z),this.x=e,this.y=t,this.z=n,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this}multiplyVectors(e,t){return this.x=e.x*t.x,this.y=e.y*t.y,this.z=e.z*t.z,this}applyEuler(e){return this.applyQuaternion(uf.setFromEuler(e))}applyAxisAngle(e,t){return this.applyQuaternion(uf.setFromAxisAngle(e,t))}applyMatrix3(e){let t=this.x,n=this.y,r=this.z,s=e.elements;return this.x=s[0]*t+s[3]*n+s[6]*r,this.y=s[1]*t+s[4]*n+s[7]*r,this.z=s[2]*t+s[5]*n+s[8]*r,this}applyNormalMatrix(e){return this.applyMatrix3(e).normalize()}applyMatrix4(e){let t=this.x,n=this.y,r=this.z,s=e.elements,a=1/(s[3]*t+s[7]*n+s[11]*r+s[15]);return this.x=(s[0]*t+s[4]*n+s[8]*r+s[12])*a,this.y=(s[1]*t+s[5]*n+s[9]*r+s[13])*a,this.z=(s[2]*t+s[6]*n+s[10]*r+s[14])*a,this}applyQuaternion(e){let t=this.x,n=this.y,r=this.z,s=e.x,a=e.y,o=e.z,l=e.w,c=2*(a*r-o*n),u=2*(o*t-s*r),f=2*(s*n-a*t);return this.x=t+l*c+a*f-o*u,this.y=n+l*u+o*c-s*f,this.z=r+l*f+s*u-a*c,this}project(e){return this.applyMatrix4(e.matrixWorldInverse).applyMatrix4(e.projectionMatrix)}unproject(e){return this.applyMatrix4(e.projectionMatrixInverse).applyMatrix4(e.matrixWorld)}transformDirection(e){let t=this.x,n=this.y,r=this.z,s=e.elements;return this.x=s[0]*t+s[4]*n+s[8]*r,this.y=s[1]*t+s[5]*n+s[9]*r,this.z=s[2]*t+s[6]*n+s[10]*r,this.normalize()}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this}divideScalar(e){return this.multiplyScalar(1/e)}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this}clamp(e,t){return this.x=Math.max(e.x,Math.min(t.x,this.x)),this.y=Math.max(e.y,Math.min(t.y,this.y)),this.z=Math.max(e.z,Math.min(t.z,this.z)),this}clampScalar(e,t){return this.x=Math.max(e,Math.min(t,this.x)),this.y=Math.max(e,Math.min(t,this.y)),this.z=Math.max(e,Math.min(t,this.z)),this}clampLength(e,t){let n=this.length();return this.divideScalar(n||1).multiplyScalar(Math.max(e,Math.min(t,n)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this.z=e.z+(t.z-e.z)*n,this}cross(e){return this.crossVectors(this,e)}crossVectors(e,t){let n=e.x,r=e.y,s=e.z,a=t.x,o=t.y,l=t.z;return this.x=r*l-s*o,this.y=s*a-n*l,this.z=n*o-r*a,this}projectOnVector(e){let t=e.lengthSq();if(t===0)return this.set(0,0,0);let n=e.dot(this)/t;return this.copy(e).multiplyScalar(n)}projectOnPlane(e){return ko.copy(this).projectOnVector(e),this.sub(ko)}reflect(e){return this.sub(ko.copy(e).multiplyScalar(2*this.dot(e)))}angleTo(e){let t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;let n=this.dot(e)/t;return Math.acos(Tt(n,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){let t=this.x-e.x,n=this.y-e.y,r=this.z-e.z;return t*t+n*n+r*r}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)+Math.abs(this.z-e.z)}setFromSpherical(e){return this.setFromSphericalCoords(e.radius,e.phi,e.theta)}setFromSphericalCoords(e,t,n){let r=Math.sin(t)*e;return this.x=r*Math.sin(n),this.y=Math.cos(t)*e,this.z=r*Math.cos(n),this}setFromCylindrical(e){return this.setFromCylindricalCoords(e.radius,e.theta,e.y)}setFromCylindricalCoords(e,t,n){return this.x=e*Math.sin(t),this.y=n,this.z=e*Math.cos(t),this}setFromMatrixPosition(e){let t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this}setFromMatrixScale(e){let t=this.setFromMatrixColumn(e,0).length(),n=this.setFromMatrixColumn(e,1).length(),r=this.setFromMatrixColumn(e,2).length();return this.x=t,this.y=n,this.z=r,this}setFromMatrixColumn(e,t){return this.fromArray(e.elements,t*4)}setFromMatrix3Column(e,t){return this.fromArray(e.elements,t*3)}setFromEuler(e){return this.x=e._x,this.y=e._y,this.z=e._z,this}setFromColor(e){return this.x=e.r,this.y=e.g,this.z=e.b,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){let e=Math.random()*Math.PI*2,t=Math.random()*2-1,n=Math.sqrt(1-t*t);return this.x=n*Math.cos(e),this.y=t,this.z=n*Math.sin(e),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}},ko=new O,uf=new ln,yi=class{constructor(e=new O(1/0,1/0,1/0),t=new O(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=e,this.max=t}set(e,t){return this.min.copy(e),this.max.copy(t),this}setFromArray(e){this.makeEmpty();for(let t=0,n=e.length;t<n;t+=3)this.expandByPoint(tn.fromArray(e,t));return this}setFromBufferAttribute(e){this.makeEmpty();for(let t=0,n=e.count;t<n;t++)this.expandByPoint(tn.fromBufferAttribute(e,t));return this}setFromPoints(e){this.makeEmpty();for(let t=0,n=e.length;t<n;t++)this.expandByPoint(e[t]);return this}setFromCenterAndSize(e,t){let n=tn.copy(t).multiplyScalar(.5);return this.min.copy(e).sub(n),this.max.copy(e).add(n),this}setFromObject(e,t=!1){return this.makeEmpty(),this.expandByObject(e,t)}clone(){return new this.constructor().copy(this)}copy(e){return this.min.copy(e.min),this.max.copy(e.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(e){return this.isEmpty()?e.set(0,0,0):e.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(e){return this.isEmpty()?e.set(0,0,0):e.subVectors(this.max,this.min)}expandByPoint(e){return this.min.min(e),this.max.max(e),this}expandByVector(e){return this.min.sub(e),this.max.add(e),this}expandByScalar(e){return this.min.addScalar(-e),this.max.addScalar(e),this}expandByObject(e,t=!1){e.updateWorldMatrix(!1,!1);let n=e.geometry;if(n!==void 0){let s=n.getAttribute("position");if(t===!0&&s!==void 0&&e.isInstancedMesh!==!0)for(let a=0,o=s.count;a<o;a++)e.isMesh===!0?e.getVertexPosition(a,tn):tn.fromBufferAttribute(s,a),tn.applyMatrix4(e.matrixWorld),this.expandByPoint(tn);else e.boundingBox!==void 0?(e.boundingBox===null&&e.computeBoundingBox(),ys.copy(e.boundingBox)):(n.boundingBox===null&&n.computeBoundingBox(),ys.copy(n.boundingBox)),ys.applyMatrix4(e.matrixWorld),this.union(ys)}let r=e.children;for(let s=0,a=r.length;s<a;s++)this.expandByObject(r[s],t);return this}containsPoint(e){return e.x>=this.min.x&&e.x<=this.max.x&&e.y>=this.min.y&&e.y<=this.max.y&&e.z>=this.min.z&&e.z<=this.max.z}containsBox(e){return this.min.x<=e.min.x&&e.max.x<=this.max.x&&this.min.y<=e.min.y&&e.max.y<=this.max.y&&this.min.z<=e.min.z&&e.max.z<=this.max.z}getParameter(e,t){return t.set((e.x-this.min.x)/(this.max.x-this.min.x),(e.y-this.min.y)/(this.max.y-this.min.y),(e.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(e){return e.max.x>=this.min.x&&e.min.x<=this.max.x&&e.max.y>=this.min.y&&e.min.y<=this.max.y&&e.max.z>=this.min.z&&e.min.z<=this.max.z}intersectsSphere(e){return this.clampPoint(e.center,tn),tn.distanceToSquared(e.center)<=e.radius*e.radius}intersectsPlane(e){let t,n;return e.normal.x>0?(t=e.normal.x*this.min.x,n=e.normal.x*this.max.x):(t=e.normal.x*this.max.x,n=e.normal.x*this.min.x),e.normal.y>0?(t+=e.normal.y*this.min.y,n+=e.normal.y*this.max.y):(t+=e.normal.y*this.max.y,n+=e.normal.y*this.min.y),e.normal.z>0?(t+=e.normal.z*this.min.z,n+=e.normal.z*this.max.z):(t+=e.normal.z*this.max.z,n+=e.normal.z*this.min.z),t<=-e.constant&&n>=-e.constant}intersectsTriangle(e){if(this.isEmpty())return!1;this.getCenter(Lr),vs.subVectors(this.max,Lr),Hi.subVectors(e.a,Lr),Vi.subVectors(e.b,Lr),Gi.subVectors(e.c,Lr),Xn.subVectors(Vi,Hi),qn.subVectors(Gi,Vi),ai.subVectors(Hi,Gi);let t=[0,-Xn.z,Xn.y,0,-qn.z,qn.y,0,-ai.z,ai.y,Xn.z,0,-Xn.x,qn.z,0,-qn.x,ai.z,0,-ai.x,-Xn.y,Xn.x,0,-qn.y,qn.x,0,-ai.y,ai.x,0];return!zo(t,Hi,Vi,Gi,vs)||(t=[1,0,0,0,1,0,0,0,1],!zo(t,Hi,Vi,Gi,vs))?!1:(Ss.crossVectors(Xn,qn),t=[Ss.x,Ss.y,Ss.z],zo(t,Hi,Vi,Gi,vs))}clampPoint(e,t){return t.copy(e).clamp(this.min,this.max)}distanceToPoint(e){return this.clampPoint(e,tn).distanceTo(e)}getBoundingSphere(e){return this.isEmpty()?e.makeEmpty():(this.getCenter(e.center),e.radius=this.getSize(tn).length()*.5),e}intersect(e){return this.min.max(e.min),this.max.min(e.max),this.isEmpty()&&this.makeEmpty(),this}union(e){return this.min.min(e.min),this.max.max(e.max),this}applyMatrix4(e){return this.isEmpty()?this:(En[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(e),En[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(e),En[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(e),En[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(e),En[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(e),En[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(e),En[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(e),En[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(e),this.setFromPoints(En),this)}translate(e){return this.min.add(e),this.max.add(e),this}equals(e){return e.min.equals(this.min)&&e.max.equals(this.max)}},En=[new O,new O,new O,new O,new O,new O,new O,new O],tn=new O,ys=new yi,Hi=new O,Vi=new O,Gi=new O,Xn=new O,qn=new O,ai=new O,Lr=new O,vs=new O,Ss=new O,oi=new O;function zo(i,e,t,n,r){for(let s=0,a=i.length-3;s<=a;s+=3){oi.fromArray(i,s);let o=r.x*Math.abs(oi.x)+r.y*Math.abs(oi.y)+r.z*Math.abs(oi.z),l=e.dot(oi),c=t.dot(oi),u=n.dot(oi);if(Math.max(-Math.max(l,c,u),Math.min(l,c,u))>o)return!1}return!0}var Kp=new yi,Dr=new O,Ho=new O,Gr=class{constructor(e=new O,t=-1){this.isSphere=!0,this.center=e,this.radius=t}set(e,t){return this.center.copy(e),this.radius=t,this}setFromPoints(e,t){let n=this.center;t!==void 0?n.copy(t):Kp.setFromPoints(e).getCenter(n);let r=0;for(let s=0,a=e.length;s<a;s++)r=Math.max(r,n.distanceToSquared(e[s]));return this.radius=Math.sqrt(r),this}copy(e){return this.center.copy(e.center),this.radius=e.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(e){return e.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(e){return e.distanceTo(this.center)-this.radius}intersectsSphere(e){let t=this.radius+e.radius;return e.center.distanceToSquared(this.center)<=t*t}intersectsBox(e){return e.intersectsSphere(this)}intersectsPlane(e){return Math.abs(e.distanceToPoint(this.center))<=this.radius}clampPoint(e,t){let n=this.center.distanceToSquared(e);return t.copy(e),n>this.radius*this.radius&&(t.sub(this.center).normalize(),t.multiplyScalar(this.radius).add(this.center)),t}getBoundingBox(e){return this.isEmpty()?(e.makeEmpty(),e):(e.set(this.center,this.center),e.expandByScalar(this.radius),e)}applyMatrix4(e){return this.center.applyMatrix4(e),this.radius=this.radius*e.getMaxScaleOnAxis(),this}translate(e){return this.center.add(e),this}expandByPoint(e){if(this.isEmpty())return this.center.copy(e),this.radius=0,this;Dr.subVectors(e,this.center);let t=Dr.lengthSq();if(t>this.radius*this.radius){let n=Math.sqrt(t),r=(n-this.radius)*.5;this.center.addScaledVector(Dr,r/n),this.radius+=r}return this}union(e){return e.isEmpty()?this:this.isEmpty()?(this.copy(e),this):(this.center.equals(e.center)===!0?this.radius=Math.max(this.radius,e.radius):(Ho.subVectors(e.center,this.center).setLength(e.radius),this.expandByPoint(Dr.copy(e.center).add(Ho)),this.expandByPoint(Dr.copy(e.center).sub(Ho))),this)}equals(e){return e.center.equals(this.center)&&e.radius===this.radius}clone(){return new this.constructor().copy(this)}},Tn=new O,Vo=new O,Ms=new O,Yn=new O,Go=new O,bs=new O,Wo=new O,ur=class{constructor(e=new O,t=new O(0,0,-1)){this.origin=e,this.direction=t}set(e,t){return this.origin.copy(e),this.direction.copy(t),this}copy(e){return this.origin.copy(e.origin),this.direction.copy(e.direction),this}at(e,t){return t.copy(this.origin).addScaledVector(this.direction,e)}lookAt(e){return this.direction.copy(e).sub(this.origin).normalize(),this}recast(e){return this.origin.copy(this.at(e,Tn)),this}closestPointToPoint(e,t){t.subVectors(e,this.origin);let n=t.dot(this.direction);return n<0?t.copy(this.origin):t.copy(this.origin).addScaledVector(this.direction,n)}distanceToPoint(e){return Math.sqrt(this.distanceSqToPoint(e))}distanceSqToPoint(e){let t=Tn.subVectors(e,this.origin).dot(this.direction);return t<0?this.origin.distanceToSquared(e):(Tn.copy(this.origin).addScaledVector(this.direction,t),Tn.distanceToSquared(e))}distanceSqToSegment(e,t,n,r){Vo.copy(e).add(t).multiplyScalar(.5),Ms.copy(t).sub(e).normalize(),Yn.copy(this.origin).sub(Vo);let s=e.distanceTo(t)*.5,a=-this.direction.dot(Ms),o=Yn.dot(this.direction),l=-Yn.dot(Ms),c=Yn.lengthSq(),u=Math.abs(1-a*a),f,d,p,g;if(u>0)if(f=a*l-o,d=a*o-l,g=s*u,f>=0)if(d>=-g)if(d<=g){let _=1/u;f*=_,d*=_,p=f*(f+a*d+2*o)+d*(a*f+d+2*l)+c}else d=s,f=Math.max(0,-(a*d+o)),p=-f*f+d*(d+2*l)+c;else d=-s,f=Math.max(0,-(a*d+o)),p=-f*f+d*(d+2*l)+c;else d<=-g?(f=Math.max(0,-(-a*s+o)),d=f>0?-s:Math.min(Math.max(-s,-l),s),p=-f*f+d*(d+2*l)+c):d<=g?(f=0,d=Math.min(Math.max(-s,-l),s),p=d*(d+2*l)+c):(f=Math.max(0,-(a*s+o)),d=f>0?s:Math.min(Math.max(-s,-l),s),p=-f*f+d*(d+2*l)+c);else d=a>0?-s:s,f=Math.max(0,-(a*d+o)),p=-f*f+d*(d+2*l)+c;return n&&n.copy(this.origin).addScaledVector(this.direction,f),r&&r.copy(Vo).addScaledVector(Ms,d),p}intersectSphere(e,t){Tn.subVectors(e.center,this.origin);let n=Tn.dot(this.direction),r=Tn.dot(Tn)-n*n,s=e.radius*e.radius;if(r>s)return null;let a=Math.sqrt(s-r),o=n-a,l=n+a;return l<0?null:o<0?this.at(l,t):this.at(o,t)}intersectsSphere(e){return this.distanceSqToPoint(e.center)<=e.radius*e.radius}distanceToPlane(e){let t=e.normal.dot(this.direction);if(t===0)return e.distanceToPoint(this.origin)===0?0:null;let n=-(this.origin.dot(e.normal)+e.constant)/t;return n>=0?n:null}intersectPlane(e,t){let n=this.distanceToPlane(e);return n===null?null:this.at(n,t)}intersectsPlane(e){let t=e.distanceToPoint(this.origin);return t===0||e.normal.dot(this.direction)*t<0}intersectBox(e,t){let n,r,s,a,o,l,c=1/this.direction.x,u=1/this.direction.y,f=1/this.direction.z,d=this.origin;return c>=0?(n=(e.min.x-d.x)*c,r=(e.max.x-d.x)*c):(n=(e.max.x-d.x)*c,r=(e.min.x-d.x)*c),u>=0?(s=(e.min.y-d.y)*u,a=(e.max.y-d.y)*u):(s=(e.max.y-d.y)*u,a=(e.min.y-d.y)*u),n>a||s>r||((s>n||isNaN(n))&&(n=s),(a<r||isNaN(r))&&(r=a),f>=0?(o=(e.min.z-d.z)*f,l=(e.max.z-d.z)*f):(o=(e.max.z-d.z)*f,l=(e.min.z-d.z)*f),n>l||o>r)||((o>n||n!==n)&&(n=o),(l<r||r!==r)&&(r=l),r<0)?null:this.at(n>=0?n:r,t)}intersectsBox(e){return this.intersectBox(e,Tn)!==null}intersectTriangle(e,t,n,r,s){Go.subVectors(t,e),bs.subVectors(n,e),Wo.crossVectors(Go,bs);let a=this.direction.dot(Wo),o;if(a>0){if(r)return null;o=1}else if(a<0)o=-1,a=-a;else return null;Yn.subVectors(this.origin,e);let l=o*this.direction.dot(bs.crossVectors(Yn,bs));if(l<0)return null;let c=o*this.direction.dot(Go.cross(Yn));if(c<0||l+c>a)return null;let u=-o*Yn.dot(Wo);return u<0?null:this.at(u/a,s)}applyMatrix4(e){return this.origin.applyMatrix4(e),this.direction.transformDirection(e),this}equals(e){return e.origin.equals(this.origin)&&e.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}},dt=class i{constructor(e,t,n,r,s,a,o,l,c,u,f,d,p,g,_,m){i.prototype.isMatrix4=!0,this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],e!==void 0&&this.set(e,t,n,r,s,a,o,l,c,u,f,d,p,g,_,m)}set(e,t,n,r,s,a,o,l,c,u,f,d,p,g,_,m){let h=this.elements;return h[0]=e,h[4]=t,h[8]=n,h[12]=r,h[1]=s,h[5]=a,h[9]=o,h[13]=l,h[2]=c,h[6]=u,h[10]=f,h[14]=d,h[3]=p,h[7]=g,h[11]=_,h[15]=m,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new i().fromArray(this.elements)}copy(e){let t=this.elements,n=e.elements;return t[0]=n[0],t[1]=n[1],t[2]=n[2],t[3]=n[3],t[4]=n[4],t[5]=n[5],t[6]=n[6],t[7]=n[7],t[8]=n[8],t[9]=n[9],t[10]=n[10],t[11]=n[11],t[12]=n[12],t[13]=n[13],t[14]=n[14],t[15]=n[15],this}copyPosition(e){let t=this.elements,n=e.elements;return t[12]=n[12],t[13]=n[13],t[14]=n[14],this}setFromMatrix3(e){let t=e.elements;return this.set(t[0],t[3],t[6],0,t[1],t[4],t[7],0,t[2],t[5],t[8],0,0,0,0,1),this}extractBasis(e,t,n){return e.setFromMatrixColumn(this,0),t.setFromMatrixColumn(this,1),n.setFromMatrixColumn(this,2),this}makeBasis(e,t,n){return this.set(e.x,t.x,n.x,0,e.y,t.y,n.y,0,e.z,t.z,n.z,0,0,0,0,1),this}extractRotation(e){let t=this.elements,n=e.elements,r=1/Wi.setFromMatrixColumn(e,0).length(),s=1/Wi.setFromMatrixColumn(e,1).length(),a=1/Wi.setFromMatrixColumn(e,2).length();return t[0]=n[0]*r,t[1]=n[1]*r,t[2]=n[2]*r,t[3]=0,t[4]=n[4]*s,t[5]=n[5]*s,t[6]=n[6]*s,t[7]=0,t[8]=n[8]*a,t[9]=n[9]*a,t[10]=n[10]*a,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromEuler(e){let t=this.elements,n=e.x,r=e.y,s=e.z,a=Math.cos(n),o=Math.sin(n),l=Math.cos(r),c=Math.sin(r),u=Math.cos(s),f=Math.sin(s);if(e.order==="XYZ"){let d=a*u,p=a*f,g=o*u,_=o*f;t[0]=l*u,t[4]=-l*f,t[8]=c,t[1]=p+g*c,t[5]=d-_*c,t[9]=-o*l,t[2]=_-d*c,t[6]=g+p*c,t[10]=a*l}else if(e.order==="YXZ"){let d=l*u,p=l*f,g=c*u,_=c*f;t[0]=d+_*o,t[4]=g*o-p,t[8]=a*c,t[1]=a*f,t[5]=a*u,t[9]=-o,t[2]=p*o-g,t[6]=_+d*o,t[10]=a*l}else if(e.order==="ZXY"){let d=l*u,p=l*f,g=c*u,_=c*f;t[0]=d-_*o,t[4]=-a*f,t[8]=g+p*o,t[1]=p+g*o,t[5]=a*u,t[9]=_-d*o,t[2]=-a*c,t[6]=o,t[10]=a*l}else if(e.order==="ZYX"){let d=a*u,p=a*f,g=o*u,_=o*f;t[0]=l*u,t[4]=g*c-p,t[8]=d*c+_,t[1]=l*f,t[5]=_*c+d,t[9]=p*c-g,t[2]=-c,t[6]=o*l,t[10]=a*l}else if(e.order==="YZX"){let d=a*l,p=a*c,g=o*l,_=o*c;t[0]=l*u,t[4]=_-d*f,t[8]=g*f+p,t[1]=f,t[5]=a*u,t[9]=-o*u,t[2]=-c*u,t[6]=p*f+g,t[10]=d-_*f}else if(e.order==="XZY"){let d=a*l,p=a*c,g=o*l,_=o*c;t[0]=l*u,t[4]=-f,t[8]=c*u,t[1]=d*f+_,t[5]=a*u,t[9]=p*f-g,t[2]=g*f-p,t[6]=o*u,t[10]=_*f+d}return t[3]=0,t[7]=0,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromQuaternion(e){return this.compose(Jp,e,jp)}lookAt(e,t,n){let r=this.elements;return Ht.subVectors(e,t),Ht.lengthSq()===0&&(Ht.z=1),Ht.normalize(),$n.crossVectors(n,Ht),$n.lengthSq()===0&&(Math.abs(n.z)===1?Ht.x+=1e-4:Ht.z+=1e-4,Ht.normalize(),$n.crossVectors(n,Ht)),$n.normalize(),ws.crossVectors(Ht,$n),r[0]=$n.x,r[4]=ws.x,r[8]=Ht.x,r[1]=$n.y,r[5]=ws.y,r[9]=Ht.y,r[2]=$n.z,r[6]=ws.z,r[10]=Ht.z,this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){let n=e.elements,r=t.elements,s=this.elements,a=n[0],o=n[4],l=n[8],c=n[12],u=n[1],f=n[5],d=n[9],p=n[13],g=n[2],_=n[6],m=n[10],h=n[14],T=n[3],w=n[7],M=n[11],N=n[15],A=r[0],C=r[4],D=r[8],b=r[12],S=r[1],R=r[5],V=r[9],z=r[13],X=r[2],J=r[6],q=r[10],te=r[14],W=r[3],se=r[7],fe=r[11],Me=r[15];return s[0]=a*A+o*S+l*X+c*W,s[4]=a*C+o*R+l*J+c*se,s[8]=a*D+o*V+l*q+c*fe,s[12]=a*b+o*z+l*te+c*Me,s[1]=u*A+f*S+d*X+p*W,s[5]=u*C+f*R+d*J+p*se,s[9]=u*D+f*V+d*q+p*fe,s[13]=u*b+f*z+d*te+p*Me,s[2]=g*A+_*S+m*X+h*W,s[6]=g*C+_*R+m*J+h*se,s[10]=g*D+_*V+m*q+h*fe,s[14]=g*b+_*z+m*te+h*Me,s[3]=T*A+w*S+M*X+N*W,s[7]=T*C+w*R+M*J+N*se,s[11]=T*D+w*V+M*q+N*fe,s[15]=T*b+w*z+M*te+N*Me,this}multiplyScalar(e){let t=this.elements;return t[0]*=e,t[4]*=e,t[8]*=e,t[12]*=e,t[1]*=e,t[5]*=e,t[9]*=e,t[13]*=e,t[2]*=e,t[6]*=e,t[10]*=e,t[14]*=e,t[3]*=e,t[7]*=e,t[11]*=e,t[15]*=e,this}determinant(){let e=this.elements,t=e[0],n=e[4],r=e[8],s=e[12],a=e[1],o=e[5],l=e[9],c=e[13],u=e[2],f=e[6],d=e[10],p=e[14],g=e[3],_=e[7],m=e[11],h=e[15];return g*(+s*l*f-r*c*f-s*o*d+n*c*d+r*o*p-n*l*p)+_*(+t*l*p-t*c*d+s*a*d-r*a*p+r*c*u-s*l*u)+m*(+t*c*f-t*o*p-s*a*f+n*a*p+s*o*u-n*c*u)+h*(-r*o*u-t*l*f+t*o*d+r*a*f-n*a*d+n*l*u)}transpose(){let e=this.elements,t;return t=e[1],e[1]=e[4],e[4]=t,t=e[2],e[2]=e[8],e[8]=t,t=e[6],e[6]=e[9],e[9]=t,t=e[3],e[3]=e[12],e[12]=t,t=e[7],e[7]=e[13],e[13]=t,t=e[11],e[11]=e[14],e[14]=t,this}setPosition(e,t,n){let r=this.elements;return e.isVector3?(r[12]=e.x,r[13]=e.y,r[14]=e.z):(r[12]=e,r[13]=t,r[14]=n),this}invert(){let e=this.elements,t=e[0],n=e[1],r=e[2],s=e[3],a=e[4],o=e[5],l=e[6],c=e[7],u=e[8],f=e[9],d=e[10],p=e[11],g=e[12],_=e[13],m=e[14],h=e[15],T=f*m*c-_*d*c+_*l*p-o*m*p-f*l*h+o*d*h,w=g*d*c-u*m*c-g*l*p+a*m*p+u*l*h-a*d*h,M=u*_*c-g*f*c+g*o*p-a*_*p-u*o*h+a*f*h,N=g*f*l-u*_*l-g*o*d+a*_*d+u*o*m-a*f*m,A=t*T+n*w+r*M+s*N;if(A===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);let C=1/A;return e[0]=T*C,e[1]=(_*d*s-f*m*s-_*r*p+n*m*p+f*r*h-n*d*h)*C,e[2]=(o*m*s-_*l*s+_*r*c-n*m*c-o*r*h+n*l*h)*C,e[3]=(f*l*s-o*d*s-f*r*c+n*d*c+o*r*p-n*l*p)*C,e[4]=w*C,e[5]=(u*m*s-g*d*s+g*r*p-t*m*p-u*r*h+t*d*h)*C,e[6]=(g*l*s-a*m*s-g*r*c+t*m*c+a*r*h-t*l*h)*C,e[7]=(a*d*s-u*l*s+u*r*c-t*d*c-a*r*p+t*l*p)*C,e[8]=M*C,e[9]=(g*f*s-u*_*s-g*n*p+t*_*p+u*n*h-t*f*h)*C,e[10]=(a*_*s-g*o*s+g*n*c-t*_*c-a*n*h+t*o*h)*C,e[11]=(u*o*s-a*f*s-u*n*c+t*f*c+a*n*p-t*o*p)*C,e[12]=N*C,e[13]=(u*_*r-g*f*r+g*n*d-t*_*d-u*n*m+t*f*m)*C,e[14]=(g*o*r-a*_*r-g*n*l+t*_*l+a*n*m-t*o*m)*C,e[15]=(a*f*r-u*o*r+u*n*l-t*f*l-a*n*d+t*o*d)*C,this}scale(e){let t=this.elements,n=e.x,r=e.y,s=e.z;return t[0]*=n,t[4]*=r,t[8]*=s,t[1]*=n,t[5]*=r,t[9]*=s,t[2]*=n,t[6]*=r,t[10]*=s,t[3]*=n,t[7]*=r,t[11]*=s,this}getMaxScaleOnAxis(){let e=this.elements,t=e[0]*e[0]+e[1]*e[1]+e[2]*e[2],n=e[4]*e[4]+e[5]*e[5]+e[6]*e[6],r=e[8]*e[8]+e[9]*e[9]+e[10]*e[10];return Math.sqrt(Math.max(t,n,r))}makeTranslation(e,t,n){return e.isVector3?this.set(1,0,0,e.x,0,1,0,e.y,0,0,1,e.z,0,0,0,1):this.set(1,0,0,e,0,1,0,t,0,0,1,n,0,0,0,1),this}makeRotationX(e){let t=Math.cos(e),n=Math.sin(e);return this.set(1,0,0,0,0,t,-n,0,0,n,t,0,0,0,0,1),this}makeRotationY(e){let t=Math.cos(e),n=Math.sin(e);return this.set(t,0,n,0,0,1,0,0,-n,0,t,0,0,0,0,1),this}makeRotationZ(e){let t=Math.cos(e),n=Math.sin(e);return this.set(t,-n,0,0,n,t,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(e,t){let n=Math.cos(t),r=Math.sin(t),s=1-n,a=e.x,o=e.y,l=e.z,c=s*a,u=s*o;return this.set(c*a+n,c*o-r*l,c*l+r*o,0,c*o+r*l,u*o+n,u*l-r*a,0,c*l-r*o,u*l+r*a,s*l*l+n,0,0,0,0,1),this}makeScale(e,t,n){return this.set(e,0,0,0,0,t,0,0,0,0,n,0,0,0,0,1),this}makeShear(e,t,n,r,s,a){return this.set(1,n,s,0,e,1,a,0,t,r,1,0,0,0,0,1),this}compose(e,t,n){let r=this.elements,s=t._x,a=t._y,o=t._z,l=t._w,c=s+s,u=a+a,f=o+o,d=s*c,p=s*u,g=s*f,_=a*u,m=a*f,h=o*f,T=l*c,w=l*u,M=l*f,N=n.x,A=n.y,C=n.z;return r[0]=(1-(_+h))*N,r[1]=(p+M)*N,r[2]=(g-w)*N,r[3]=0,r[4]=(p-M)*A,r[5]=(1-(d+h))*A,r[6]=(m+T)*A,r[7]=0,r[8]=(g+w)*C,r[9]=(m-T)*C,r[10]=(1-(d+_))*C,r[11]=0,r[12]=e.x,r[13]=e.y,r[14]=e.z,r[15]=1,this}decompose(e,t,n){let r=this.elements,s=Wi.set(r[0],r[1],r[2]).length(),a=Wi.set(r[4],r[5],r[6]).length(),o=Wi.set(r[8],r[9],r[10]).length();this.determinant()<0&&(s=-s),e.x=r[12],e.y=r[13],e.z=r[14],nn.copy(this);let c=1/s,u=1/a,f=1/o;return nn.elements[0]*=c,nn.elements[1]*=c,nn.elements[2]*=c,nn.elements[4]*=u,nn.elements[5]*=u,nn.elements[6]*=u,nn.elements[8]*=f,nn.elements[9]*=f,nn.elements[10]*=f,t.setFromRotationMatrix(nn),n.x=s,n.y=a,n.z=o,this}makePerspective(e,t,n,r,s,a,o=Dn){let l=this.elements,c=2*s/(t-e),u=2*s/(n-r),f=(t+e)/(t-e),d=(n+r)/(n-r),p,g;if(o===Dn)p=-(a+s)/(a-s),g=-2*a*s/(a-s);else if(o===qs)p=-a/(a-s),g=-a*s/(a-s);else throw new Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: "+o);return l[0]=c,l[4]=0,l[8]=f,l[12]=0,l[1]=0,l[5]=u,l[9]=d,l[13]=0,l[2]=0,l[6]=0,l[10]=p,l[14]=g,l[3]=0,l[7]=0,l[11]=-1,l[15]=0,this}makeOrthographic(e,t,n,r,s,a,o=Dn){let l=this.elements,c=1/(t-e),u=1/(n-r),f=1/(a-s),d=(t+e)*c,p=(n+r)*u,g,_;if(o===Dn)g=(a+s)*f,_=-2*f;else if(o===qs)g=s*f,_=-1*f;else throw new Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: "+o);return l[0]=2*c,l[4]=0,l[8]=0,l[12]=-d,l[1]=0,l[5]=2*u,l[9]=0,l[13]=-p,l[2]=0,l[6]=0,l[10]=_,l[14]=-g,l[3]=0,l[7]=0,l[11]=0,l[15]=1,this}equals(e){let t=this.elements,n=e.elements;for(let r=0;r<16;r++)if(t[r]!==n[r])return!1;return!0}fromArray(e,t=0){for(let n=0;n<16;n++)this.elements[n]=e[n+t];return this}toArray(e=[],t=0){let n=this.elements;return e[t]=n[0],e[t+1]=n[1],e[t+2]=n[2],e[t+3]=n[3],e[t+4]=n[4],e[t+5]=n[5],e[t+6]=n[6],e[t+7]=n[7],e[t+8]=n[8],e[t+9]=n[9],e[t+10]=n[10],e[t+11]=n[11],e[t+12]=n[12],e[t+13]=n[13],e[t+14]=n[14],e[t+15]=n[15],e}},Wi=new O,nn=new dt,Jp=new O(0,0,0),jp=new O(1,1,1),$n=new O,ws=new O,Ht=new O,ff=new dt,hf=new ln,Zt=class i{constructor(e=0,t=0,n=0,r=i.DEFAULT_ORDER){this.isEuler=!0,this._x=e,this._y=t,this._z=n,this._order=r}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get order(){return this._order}set order(e){this._order=e,this._onChangeCallback()}set(e,t,n,r=this._order){return this._x=e,this._y=t,this._z=n,this._order=r,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(e){return this._x=e._x,this._y=e._y,this._z=e._z,this._order=e._order,this._onChangeCallback(),this}setFromRotationMatrix(e,t=this._order,n=!0){let r=e.elements,s=r[0],a=r[4],o=r[8],l=r[1],c=r[5],u=r[9],f=r[2],d=r[6],p=r[10];switch(t){case"XYZ":this._y=Math.asin(Tt(o,-1,1)),Math.abs(o)<.9999999?(this._x=Math.atan2(-u,p),this._z=Math.atan2(-a,s)):(this._x=Math.atan2(d,c),this._z=0);break;case"YXZ":this._x=Math.asin(-Tt(u,-1,1)),Math.abs(u)<.9999999?(this._y=Math.atan2(o,p),this._z=Math.atan2(l,c)):(this._y=Math.atan2(-f,s),this._z=0);break;case"ZXY":this._x=Math.asin(Tt(d,-1,1)),Math.abs(d)<.9999999?(this._y=Math.atan2(-f,p),this._z=Math.atan2(-a,c)):(this._y=0,this._z=Math.atan2(l,s));break;case"ZYX":this._y=Math.asin(-Tt(f,-1,1)),Math.abs(f)<.9999999?(this._x=Math.atan2(d,p),this._z=Math.atan2(l,s)):(this._x=0,this._z=Math.atan2(-a,c));break;case"YZX":this._z=Math.asin(Tt(l,-1,1)),Math.abs(l)<.9999999?(this._x=Math.atan2(-u,c),this._y=Math.atan2(-f,s)):(this._x=0,this._y=Math.atan2(o,p));break;case"XZY":this._z=Math.asin(-Tt(a,-1,1)),Math.abs(a)<.9999999?(this._x=Math.atan2(d,c),this._y=Math.atan2(o,s)):(this._x=Math.atan2(-u,p),this._y=0);break;default:console.warn("THREE.Euler: .setFromRotationMatrix() encountered an unknown order: "+t)}return this._order=t,n===!0&&this._onChangeCallback(),this}setFromQuaternion(e,t,n){return ff.makeRotationFromQuaternion(e),this.setFromRotationMatrix(ff,t,n)}setFromVector3(e,t=this._order){return this.set(e.x,e.y,e.z,t)}reorder(e){return hf.setFromEuler(this),this.setFromQuaternion(hf,e)}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._order===this._order}fromArray(e){return this._x=e[0],this._y=e[1],this._z=e[2],e[3]!==void 0&&(this._order=e[3]),this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._order,e}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}};Zt.DEFAULT_ORDER="XYZ";var Wr=class{constructor(){this.mask=1}set(e){this.mask=(1<<e|0)>>>0}enable(e){this.mask|=1<<e|0}enableAll(){this.mask=-1}toggle(e){this.mask^=1<<e|0}disable(e){this.mask&=~(1<<e|0)}disableAll(){this.mask=0}test(e){return(this.mask&e.mask)!==0}isEnabled(e){return(this.mask&(1<<e|0))!==0}},Qp=0,df=new O,Xi=new ln,An=new dt,Es=new O,Ur=new O,em=new O,tm=new ln,pf=new O(1,0,0),mf=new O(0,1,0),gf=new O(0,0,1),xf={type:"added"},nm={type:"removed"},qi={type:"childadded",child:null},Xo={type:"childremoved",child:null},Ut=class i extends On{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:Qp++}),this.uuid=gr(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=i.DEFAULT_UP.clone();let e=new O,t=new Zt,n=new ln,r=new O(1,1,1);function s(){n.setFromEuler(t,!1)}function a(){t.setFromQuaternion(n,void 0,!1)}t._onChange(s),n._onChange(a),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:e},rotation:{configurable:!0,enumerable:!0,value:t},quaternion:{configurable:!0,enumerable:!0,value:n},scale:{configurable:!0,enumerable:!0,value:r},modelViewMatrix:{value:new dt},normalMatrix:{value:new Ne}}),this.matrix=new dt,this.matrixWorld=new dt,this.matrixAutoUpdate=i.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=i.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new Wr,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.userData={}}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(e){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(e),this.matrix.decompose(this.position,this.quaternion,this.scale)}applyQuaternion(e){return this.quaternion.premultiply(e),this}setRotationFromAxisAngle(e,t){this.quaternion.setFromAxisAngle(e,t)}setRotationFromEuler(e){this.quaternion.setFromEuler(e,!0)}setRotationFromMatrix(e){this.quaternion.setFromRotationMatrix(e)}setRotationFromQuaternion(e){this.quaternion.copy(e)}rotateOnAxis(e,t){return Xi.setFromAxisAngle(e,t),this.quaternion.multiply(Xi),this}rotateOnWorldAxis(e,t){return Xi.setFromAxisAngle(e,t),this.quaternion.premultiply(Xi),this}rotateX(e){return this.rotateOnAxis(pf,e)}rotateY(e){return this.rotateOnAxis(mf,e)}rotateZ(e){return this.rotateOnAxis(gf,e)}translateOnAxis(e,t){return df.copy(e).applyQuaternion(this.quaternion),this.position.add(df.multiplyScalar(t)),this}translateX(e){return this.translateOnAxis(pf,e)}translateY(e){return this.translateOnAxis(mf,e)}translateZ(e){return this.translateOnAxis(gf,e)}localToWorld(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(this.matrixWorld)}worldToLocal(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(An.copy(this.matrixWorld).invert())}lookAt(e,t,n){e.isVector3?Es.copy(e):Es.set(e,t,n);let r=this.parent;this.updateWorldMatrix(!0,!1),Ur.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?An.lookAt(Ur,Es,this.up):An.lookAt(Es,Ur,this.up),this.quaternion.setFromRotationMatrix(An),r&&(An.extractRotation(r.matrixWorld),Xi.setFromRotationMatrix(An),this.quaternion.premultiply(Xi.invert()))}add(e){if(arguments.length>1){for(let t=0;t<arguments.length;t++)this.add(arguments[t]);return this}return e===this?(console.error("THREE.Object3D.add: object can't be added as a child of itself.",e),this):(e&&e.isObject3D?(e.removeFromParent(),e.parent=this,this.children.push(e),e.dispatchEvent(xf),qi.child=e,this.dispatchEvent(qi),qi.child=null):console.error("THREE.Object3D.add: object not an instance of THREE.Object3D.",e),this)}remove(e){if(arguments.length>1){for(let n=0;n<arguments.length;n++)this.remove(arguments[n]);return this}let t=this.children.indexOf(e);return t!==-1&&(e.parent=null,this.children.splice(t,1),e.dispatchEvent(nm),Xo.child=e,this.dispatchEvent(Xo),Xo.child=null),this}removeFromParent(){let e=this.parent;return e!==null&&e.remove(this),this}clear(){return this.remove(...this.children)}attach(e){return this.updateWorldMatrix(!0,!1),An.copy(this.matrixWorld).invert(),e.parent!==null&&(e.parent.updateWorldMatrix(!0,!1),An.multiply(e.parent.matrixWorld)),e.applyMatrix4(An),e.removeFromParent(),e.parent=this,this.children.push(e),e.updateWorldMatrix(!1,!0),e.dispatchEvent(xf),qi.child=e,this.dispatchEvent(qi),qi.child=null,this}getObjectById(e){return this.getObjectByProperty("id",e)}getObjectByName(e){return this.getObjectByProperty("name",e)}getObjectByProperty(e,t){if(this[e]===t)return this;for(let n=0,r=this.children.length;n<r;n++){let a=this.children[n].getObjectByProperty(e,t);if(a!==void 0)return a}}getObjectsByProperty(e,t,n=[]){this[e]===t&&n.push(this);let r=this.children;for(let s=0,a=r.length;s<a;s++)r[s].getObjectsByProperty(e,t,n);return n}getWorldPosition(e){return this.updateWorldMatrix(!0,!1),e.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Ur,e,em),e}getWorldScale(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Ur,tm,e),e}getWorldDirection(e){this.updateWorldMatrix(!0,!1);let t=this.matrixWorld.elements;return e.set(t[8],t[9],t[10]).normalize()}raycast(){}traverse(e){e(this);let t=this.children;for(let n=0,r=t.length;n<r;n++)t[n].traverse(e)}traverseVisible(e){if(this.visible===!1)return;e(this);let t=this.children;for(let n=0,r=t.length;n<r;n++)t[n].traverseVisible(e)}traverseAncestors(e){let t=this.parent;t!==null&&(e(t),t.traverseAncestors(e))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale),this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(e){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||e)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,e=!0);let t=this.children;for(let n=0,r=t.length;n<r;n++)t[n].updateMatrixWorld(e)}updateWorldMatrix(e,t){let n=this.parent;if(e===!0&&n!==null&&n.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),t===!0){let r=this.children;for(let s=0,a=r.length;s<a;s++)r[s].updateWorldMatrix(!1,!0)}}toJSON(e){let t=e===void 0||typeof e=="string",n={};t&&(e={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},n.metadata={version:4.6,type:"Object",generator:"Object3D.toJSON"});let r={};r.uuid=this.uuid,r.type=this.type,this.name!==""&&(r.name=this.name),this.castShadow===!0&&(r.castShadow=!0),this.receiveShadow===!0&&(r.receiveShadow=!0),this.visible===!1&&(r.visible=!1),this.frustumCulled===!1&&(r.frustumCulled=!1),this.renderOrder!==0&&(r.renderOrder=this.renderOrder),Object.keys(this.userData).length>0&&(r.userData=this.userData),r.layers=this.layers.mask,r.matrix=this.matrix.toArray(),r.up=this.up.toArray(),this.matrixAutoUpdate===!1&&(r.matrixAutoUpdate=!1),this.isInstancedMesh&&(r.type="InstancedMesh",r.count=this.count,r.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(r.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(r.type="BatchedMesh",r.perObjectFrustumCulled=this.perObjectFrustumCulled,r.sortObjects=this.sortObjects,r.drawRanges=this._drawRanges,r.reservedRanges=this._reservedRanges,r.visibility=this._visibility,r.active=this._active,r.bounds=this._bounds.map(o=>({boxInitialized:o.boxInitialized,boxMin:o.box.min.toArray(),boxMax:o.box.max.toArray(),sphereInitialized:o.sphereInitialized,sphereRadius:o.sphere.radius,sphereCenter:o.sphere.center.toArray()})),r.maxInstanceCount=this._maxInstanceCount,r.maxVertexCount=this._maxVertexCount,r.maxIndexCount=this._maxIndexCount,r.geometryInitialized=this._geometryInitialized,r.geometryCount=this._geometryCount,r.matricesTexture=this._matricesTexture.toJSON(e),this._colorsTexture!==null&&(r.colorsTexture=this._colorsTexture.toJSON(e)),this.boundingSphere!==null&&(r.boundingSphere={center:r.boundingSphere.center.toArray(),radius:r.boundingSphere.radius}),this.boundingBox!==null&&(r.boundingBox={min:r.boundingBox.min.toArray(),max:r.boundingBox.max.toArray()}));function s(o,l){return o[l.uuid]===void 0&&(o[l.uuid]=l.toJSON(e)),l.uuid}if(this.isScene)this.background&&(this.background.isColor?r.background=this.background.toJSON():this.background.isTexture&&(r.background=this.background.toJSON(e).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(r.environment=this.environment.toJSON(e).uuid);else if(this.isMesh||this.isLine||this.isPoints){r.geometry=s(e.geometries,this.geometry);let o=this.geometry.parameters;if(o!==void 0&&o.shapes!==void 0){let l=o.shapes;if(Array.isArray(l))for(let c=0,u=l.length;c<u;c++){let f=l[c];s(e.shapes,f)}else s(e.shapes,l)}}if(this.isSkinnedMesh&&(r.bindMode=this.bindMode,r.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(s(e.skeletons,this.skeleton),r.skeleton=this.skeleton.uuid)),this.material!==void 0)if(Array.isArray(this.material)){let o=[];for(let l=0,c=this.material.length;l<c;l++)o.push(s(e.materials,this.material[l]));r.material=o}else r.material=s(e.materials,this.material);if(this.children.length>0){r.children=[];for(let o=0;o<this.children.length;o++)r.children.push(this.children[o].toJSON(e).object)}if(this.animations.length>0){r.animations=[];for(let o=0;o<this.animations.length;o++){let l=this.animations[o];r.animations.push(s(e.animations,l))}}if(t){let o=a(e.geometries),l=a(e.materials),c=a(e.textures),u=a(e.images),f=a(e.shapes),d=a(e.skeletons),p=a(e.animations),g=a(e.nodes);o.length>0&&(n.geometries=o),l.length>0&&(n.materials=l),c.length>0&&(n.textures=c),u.length>0&&(n.images=u),f.length>0&&(n.shapes=f),d.length>0&&(n.skeletons=d),p.length>0&&(n.animations=p),g.length>0&&(n.nodes=g)}return n.object=r,n;function a(o){let l=[];for(let c in o){let u=o[c];delete u.metadata,l.push(u)}return l}}clone(e){return new this.constructor().copy(this,e)}copy(e,t=!0){if(this.name=e.name,this.up.copy(e.up),this.position.copy(e.position),this.rotation.order=e.rotation.order,this.quaternion.copy(e.quaternion),this.scale.copy(e.scale),this.matrix.copy(e.matrix),this.matrixWorld.copy(e.matrixWorld),this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrixWorldAutoUpdate=e.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=e.matrixWorldNeedsUpdate,this.layers.mask=e.layers.mask,this.visible=e.visible,this.castShadow=e.castShadow,this.receiveShadow=e.receiveShadow,this.frustumCulled=e.frustumCulled,this.renderOrder=e.renderOrder,this.animations=e.animations.slice(),this.userData=JSON.parse(JSON.stringify(e.userData)),t===!0)for(let n=0;n<e.children.length;n++){let r=e.children[n];this.add(r.clone())}return this}};Ut.DEFAULT_UP=new O(0,1,0);Ut.DEFAULT_MATRIX_AUTO_UPDATE=!0;Ut.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;var rn=new O,Cn=new O,qo=new O,Rn=new O,Yi=new O,$i=new O,_f=new O,Yo=new O,$o=new O,Zo=new O,Ko=new ht,Jo=new ht,jo=new ht,pi=class i{constructor(e=new O,t=new O,n=new O){this.a=e,this.b=t,this.c=n}static getNormal(e,t,n,r){r.subVectors(n,t),rn.subVectors(e,t),r.cross(rn);let s=r.lengthSq();return s>0?r.multiplyScalar(1/Math.sqrt(s)):r.set(0,0,0)}static getBarycoord(e,t,n,r,s){rn.subVectors(r,t),Cn.subVectors(n,t),qo.subVectors(e,t);let a=rn.dot(rn),o=rn.dot(Cn),l=rn.dot(qo),c=Cn.dot(Cn),u=Cn.dot(qo),f=a*c-o*o;if(f===0)return s.set(0,0,0),null;let d=1/f,p=(c*l-o*u)*d,g=(a*u-o*l)*d;return s.set(1-p-g,g,p)}static containsPoint(e,t,n,r){return this.getBarycoord(e,t,n,r,Rn)===null?!1:Rn.x>=0&&Rn.y>=0&&Rn.x+Rn.y<=1}static getInterpolation(e,t,n,r,s,a,o,l){return this.getBarycoord(e,t,n,r,Rn)===null?(l.x=0,l.y=0,"z"in l&&(l.z=0),"w"in l&&(l.w=0),null):(l.setScalar(0),l.addScaledVector(s,Rn.x),l.addScaledVector(a,Rn.y),l.addScaledVector(o,Rn.z),l)}static getInterpolatedAttribute(e,t,n,r,s,a){return Ko.setScalar(0),Jo.setScalar(0),jo.setScalar(0),Ko.fromBufferAttribute(e,t),Jo.fromBufferAttribute(e,n),jo.fromBufferAttribute(e,r),a.setScalar(0),a.addScaledVector(Ko,s.x),a.addScaledVector(Jo,s.y),a.addScaledVector(jo,s.z),a}static isFrontFacing(e,t,n,r){return rn.subVectors(n,t),Cn.subVectors(e,t),rn.cross(Cn).dot(r)<0}set(e,t,n){return this.a.copy(e),this.b.copy(t),this.c.copy(n),this}setFromPointsAndIndices(e,t,n,r){return this.a.copy(e[t]),this.b.copy(e[n]),this.c.copy(e[r]),this}setFromAttributeAndIndices(e,t,n,r){return this.a.fromBufferAttribute(e,t),this.b.fromBufferAttribute(e,n),this.c.fromBufferAttribute(e,r),this}clone(){return new this.constructor().copy(this)}copy(e){return this.a.copy(e.a),this.b.copy(e.b),this.c.copy(e.c),this}getArea(){return rn.subVectors(this.c,this.b),Cn.subVectors(this.a,this.b),rn.cross(Cn).length()*.5}getMidpoint(e){return e.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(e){return i.getNormal(this.a,this.b,this.c,e)}getPlane(e){return e.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(e,t){return i.getBarycoord(e,this.a,this.b,this.c,t)}getInterpolation(e,t,n,r,s){return i.getInterpolation(e,this.a,this.b,this.c,t,n,r,s)}containsPoint(e){return i.containsPoint(e,this.a,this.b,this.c)}isFrontFacing(e){return i.isFrontFacing(this.a,this.b,this.c,e)}intersectsBox(e){return e.intersectsTriangle(this)}closestPointToPoint(e,t){let n=this.a,r=this.b,s=this.c,a,o;Yi.subVectors(r,n),$i.subVectors(s,n),Yo.subVectors(e,n);let l=Yi.dot(Yo),c=$i.dot(Yo);if(l<=0&&c<=0)return t.copy(n);$o.subVectors(e,r);let u=Yi.dot($o),f=$i.dot($o);if(u>=0&&f<=u)return t.copy(r);let d=l*f-u*c;if(d<=0&&l>=0&&u<=0)return a=l/(l-u),t.copy(n).addScaledVector(Yi,a);Zo.subVectors(e,s);let p=Yi.dot(Zo),g=$i.dot(Zo);if(g>=0&&p<=g)return t.copy(s);let _=p*c-l*g;if(_<=0&&c>=0&&g<=0)return o=c/(c-g),t.copy(n).addScaledVector($i,o);let m=u*g-p*f;if(m<=0&&f-u>=0&&p-g>=0)return _f.subVectors(s,r),o=(f-u)/(f-u+(p-g)),t.copy(r).addScaledVector(_f,o);let h=1/(m+_+d);return a=_*h,o=d*h,t.copy(n).addScaledVector(Yi,a).addScaledVector($i,o)}equals(e){return e.a.equals(this.a)&&e.b.equals(this.b)&&e.c.equals(this.c)}},gh={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},Zn={h:0,s:0,l:0},Ts={h:0,s:0,l:0};function Qo(i,e,t){return t<0&&(t+=1),t>1&&(t-=1),t<1/6?i+(e-i)*6*t:t<1/2?e:t<2/3?i+(e-i)*6*(2/3-t):i}var ze=class{constructor(e,t,n){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(e,t,n)}set(e,t,n){if(t===void 0&&n===void 0){let r=e;r&&r.isColor?this.copy(r):typeof r=="number"?this.setHex(r):typeof r=="string"&&this.setStyle(r)}else this.setRGB(e,t,n);return this}setScalar(e){return this.r=e,this.g=e,this.b=e,this}setHex(e,t=bt){return e=Math.floor(e),this.r=(e>>16&255)/255,this.g=(e>>8&255)/255,this.b=(e&255)/255,Ye.toWorkingColorSpace(this,t),this}setRGB(e,t,n,r=Ye.workingColorSpace){return this.r=e,this.g=t,this.b=n,Ye.toWorkingColorSpace(this,r),this}setHSL(e,t,n,r=Ye.workingColorSpace){if(e=Dc(e,1),t=Tt(t,0,1),n=Tt(n,0,1),t===0)this.r=this.g=this.b=n;else{let s=n<=.5?n*(1+t):n+t-n*t,a=2*n-s;this.r=Qo(a,s,e+1/3),this.g=Qo(a,s,e),this.b=Qo(a,s,e-1/3)}return Ye.toWorkingColorSpace(this,r),this}setStyle(e,t=bt){function n(s){s!==void 0&&parseFloat(s)<1&&console.warn("THREE.Color: Alpha component of "+e+" will be ignored.")}let r;if(r=/^(\w+)\(([^\)]*)\)/.exec(e)){let s,a=r[1],o=r[2];switch(a){case"rgb":case"rgba":if(s=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return n(s[4]),this.setRGB(Math.min(255,parseInt(s[1],10))/255,Math.min(255,parseInt(s[2],10))/255,Math.min(255,parseInt(s[3],10))/255,t);if(s=/^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return n(s[4]),this.setRGB(Math.min(100,parseInt(s[1],10))/100,Math.min(100,parseInt(s[2],10))/100,Math.min(100,parseInt(s[3],10))/100,t);break;case"hsl":case"hsla":if(s=/^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return n(s[4]),this.setHSL(parseFloat(s[1])/360,parseFloat(s[2])/100,parseFloat(s[3])/100,t);break;default:console.warn("THREE.Color: Unknown color model "+e)}}else if(r=/^\#([A-Fa-f\d]+)$/.exec(e)){let s=r[1],a=s.length;if(a===3)return this.setRGB(parseInt(s.charAt(0),16)/15,parseInt(s.charAt(1),16)/15,parseInt(s.charAt(2),16)/15,t);if(a===6)return this.setHex(parseInt(s,16),t);console.warn("THREE.Color: Invalid hex color "+e)}else if(e&&e.length>0)return this.setColorName(e,t);return this}setColorName(e,t=bt){let n=gh[e.toLowerCase()];return n!==void 0?this.setHex(n,t):console.warn("THREE.Color: Unknown color "+e),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(e){return this.r=e.r,this.g=e.g,this.b=e.b,this}copySRGBToLinear(e){return this.r=Un(e.r),this.g=Un(e.g),this.b=Un(e.b),this}copyLinearToSRGB(e){return this.r=ir(e.r),this.g=ir(e.g),this.b=ir(e.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(e=bt){return Ye.fromWorkingColorSpace(Rt.copy(this),e),Math.round(Tt(Rt.r*255,0,255))*65536+Math.round(Tt(Rt.g*255,0,255))*256+Math.round(Tt(Rt.b*255,0,255))}getHexString(e=bt){return("000000"+this.getHex(e).toString(16)).slice(-6)}getHSL(e,t=Ye.workingColorSpace){Ye.fromWorkingColorSpace(Rt.copy(this),t);let n=Rt.r,r=Rt.g,s=Rt.b,a=Math.max(n,r,s),o=Math.min(n,r,s),l,c,u=(o+a)/2;if(o===a)l=0,c=0;else{let f=a-o;switch(c=u<=.5?f/(a+o):f/(2-a-o),a){case n:l=(r-s)/f+(r<s?6:0);break;case r:l=(s-n)/f+2;break;case s:l=(n-r)/f+4;break}l/=6}return e.h=l,e.s=c,e.l=u,e}getRGB(e,t=Ye.workingColorSpace){return Ye.fromWorkingColorSpace(Rt.copy(this),t),e.r=Rt.r,e.g=Rt.g,e.b=Rt.b,e}getStyle(e=bt){Ye.fromWorkingColorSpace(Rt.copy(this),e);let t=Rt.r,n=Rt.g,r=Rt.b;return e!==bt?`color(${e} ${t.toFixed(3)} ${n.toFixed(3)} ${r.toFixed(3)})`:`rgb(${Math.round(t*255)},${Math.round(n*255)},${Math.round(r*255)})`}offsetHSL(e,t,n){return this.getHSL(Zn),this.setHSL(Zn.h+e,Zn.s+t,Zn.l+n)}add(e){return this.r+=e.r,this.g+=e.g,this.b+=e.b,this}addColors(e,t){return this.r=e.r+t.r,this.g=e.g+t.g,this.b=e.b+t.b,this}addScalar(e){return this.r+=e,this.g+=e,this.b+=e,this}sub(e){return this.r=Math.max(0,this.r-e.r),this.g=Math.max(0,this.g-e.g),this.b=Math.max(0,this.b-e.b),this}multiply(e){return this.r*=e.r,this.g*=e.g,this.b*=e.b,this}multiplyScalar(e){return this.r*=e,this.g*=e,this.b*=e,this}lerp(e,t){return this.r+=(e.r-this.r)*t,this.g+=(e.g-this.g)*t,this.b+=(e.b-this.b)*t,this}lerpColors(e,t,n){return this.r=e.r+(t.r-e.r)*n,this.g=e.g+(t.g-e.g)*n,this.b=e.b+(t.b-e.b)*n,this}lerpHSL(e,t){this.getHSL(Zn),e.getHSL(Ts);let n=kr(Zn.h,Ts.h,t),r=kr(Zn.s,Ts.s,t),s=kr(Zn.l,Ts.l,t);return this.setHSL(n,r,s),this}setFromVector3(e){return this.r=e.x,this.g=e.y,this.b=e.z,this}applyMatrix3(e){let t=this.r,n=this.g,r=this.b,s=e.elements;return this.r=s[0]*t+s[3]*n+s[6]*r,this.g=s[1]*t+s[4]*n+s[7]*r,this.b=s[2]*t+s[5]*n+s[8]*r,this}equals(e){return e.r===this.r&&e.g===this.g&&e.b===this.b}fromArray(e,t=0){return this.r=e[t],this.g=e[t+1],this.b=e[t+2],this}toArray(e=[],t=0){return e[t]=this.r,e[t+1]=this.g,e[t+2]=this.b,e}fromBufferAttribute(e,t){return this.r=e.getX(t),this.g=e.getY(t),this.b=e.getZ(t),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}},Rt=new ze;ze.NAMES=gh;var im=0,vi=class extends On{static get type(){return"Material"}get type(){return this.constructor.type}set type(e){}constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:im++}),this.uuid=gr(),this.name="",this.blending=tr,this.side=ei,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=ul,this.blendDst=fl,this.blendEquation=di,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new ze(0,0,0),this.blendAlpha=0,this.depthFunc=sr,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=Qu,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=ki,this.stencilZFail=ki,this.stencilZPass=ki,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(e){this._alphaTest>0!=e>0&&this.version++,this._alphaTest=e}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(e){if(e!==void 0)for(let t in e){let n=e[t];if(n===void 0){console.warn(`THREE.Material: parameter '${t}' has value of undefined.`);continue}let r=this[t];if(r===void 0){console.warn(`THREE.Material: '${t}' is not a property of THREE.${this.type}.`);continue}r&&r.isColor?r.set(n):r&&r.isVector3&&n&&n.isVector3?r.copy(n):this[t]=n}}toJSON(e){let t=e===void 0||typeof e=="string";t&&(e={textures:{},images:{}});let n={metadata:{version:4.6,type:"Material",generator:"Material.toJSON"}};n.uuid=this.uuid,n.type=this.type,this.name!==""&&(n.name=this.name),this.color&&this.color.isColor&&(n.color=this.color.getHex()),this.roughness!==void 0&&(n.roughness=this.roughness),this.metalness!==void 0&&(n.metalness=this.metalness),this.sheen!==void 0&&(n.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(n.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(n.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(n.emissive=this.emissive.getHex()),this.emissiveIntensity!==void 0&&this.emissiveIntensity!==1&&(n.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(n.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(n.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(n.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(n.shininess=this.shininess),this.clearcoat!==void 0&&(n.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(n.clearcoatRoughness=this.clearcoatRoughness),this.clearcoatMap&&this.clearcoatMap.isTexture&&(n.clearcoatMap=this.clearcoatMap.toJSON(e).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(n.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(e).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(n.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(e).uuid,n.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.dispersion!==void 0&&(n.dispersion=this.dispersion),this.iridescence!==void 0&&(n.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(n.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessRange!==void 0&&(n.iridescenceThicknessRange=this.iridescenceThicknessRange),this.iridescenceMap&&this.iridescenceMap.isTexture&&(n.iridescenceMap=this.iridescenceMap.toJSON(e).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(n.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(e).uuid),this.anisotropy!==void 0&&(n.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(n.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(n.anisotropyMap=this.anisotropyMap.toJSON(e).uuid),this.map&&this.map.isTexture&&(n.map=this.map.toJSON(e).uuid),this.matcap&&this.matcap.isTexture&&(n.matcap=this.matcap.toJSON(e).uuid),this.alphaMap&&this.alphaMap.isTexture&&(n.alphaMap=this.alphaMap.toJSON(e).uuid),this.lightMap&&this.lightMap.isTexture&&(n.lightMap=this.lightMap.toJSON(e).uuid,n.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(n.aoMap=this.aoMap.toJSON(e).uuid,n.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(n.bumpMap=this.bumpMap.toJSON(e).uuid,n.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(n.normalMap=this.normalMap.toJSON(e).uuid,n.normalMapType=this.normalMapType,n.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(n.displacementMap=this.displacementMap.toJSON(e).uuid,n.displacementScale=this.displacementScale,n.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(n.roughnessMap=this.roughnessMap.toJSON(e).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(n.metalnessMap=this.metalnessMap.toJSON(e).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(n.emissiveMap=this.emissiveMap.toJSON(e).uuid),this.specularMap&&this.specularMap.isTexture&&(n.specularMap=this.specularMap.toJSON(e).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(n.specularIntensityMap=this.specularIntensityMap.toJSON(e).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(n.specularColorMap=this.specularColorMap.toJSON(e).uuid),this.envMap&&this.envMap.isTexture&&(n.envMap=this.envMap.toJSON(e).uuid,this.combine!==void 0&&(n.combine=this.combine)),this.envMapRotation!==void 0&&(n.envMapRotation=this.envMapRotation.toArray()),this.envMapIntensity!==void 0&&(n.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(n.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(n.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(n.gradientMap=this.gradientMap.toJSON(e).uuid),this.transmission!==void 0&&(n.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(n.transmissionMap=this.transmissionMap.toJSON(e).uuid),this.thickness!==void 0&&(n.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(n.thicknessMap=this.thicknessMap.toJSON(e).uuid),this.attenuationDistance!==void 0&&this.attenuationDistance!==1/0&&(n.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(n.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(n.size=this.size),this.shadowSide!==null&&(n.shadowSide=this.shadowSide),this.sizeAttenuation!==void 0&&(n.sizeAttenuation=this.sizeAttenuation),this.blending!==tr&&(n.blending=this.blending),this.side!==ei&&(n.side=this.side),this.vertexColors===!0&&(n.vertexColors=!0),this.opacity<1&&(n.opacity=this.opacity),this.transparent===!0&&(n.transparent=!0),this.blendSrc!==ul&&(n.blendSrc=this.blendSrc),this.blendDst!==fl&&(n.blendDst=this.blendDst),this.blendEquation!==di&&(n.blendEquation=this.blendEquation),this.blendSrcAlpha!==null&&(n.blendSrcAlpha=this.blendSrcAlpha),this.blendDstAlpha!==null&&(n.blendDstAlpha=this.blendDstAlpha),this.blendEquationAlpha!==null&&(n.blendEquationAlpha=this.blendEquationAlpha),this.blendColor&&this.blendColor.isColor&&(n.blendColor=this.blendColor.getHex()),this.blendAlpha!==0&&(n.blendAlpha=this.blendAlpha),this.depthFunc!==sr&&(n.depthFunc=this.depthFunc),this.depthTest===!1&&(n.depthTest=this.depthTest),this.depthWrite===!1&&(n.depthWrite=this.depthWrite),this.colorWrite===!1&&(n.colorWrite=this.colorWrite),this.stencilWriteMask!==255&&(n.stencilWriteMask=this.stencilWriteMask),this.stencilFunc!==Qu&&(n.stencilFunc=this.stencilFunc),this.stencilRef!==0&&(n.stencilRef=this.stencilRef),this.stencilFuncMask!==255&&(n.stencilFuncMask=this.stencilFuncMask),this.stencilFail!==ki&&(n.stencilFail=this.stencilFail),this.stencilZFail!==ki&&(n.stencilZFail=this.stencilZFail),this.stencilZPass!==ki&&(n.stencilZPass=this.stencilZPass),this.stencilWrite===!0&&(n.stencilWrite=this.stencilWrite),this.rotation!==void 0&&this.rotation!==0&&(n.rotation=this.rotation),this.polygonOffset===!0&&(n.polygonOffset=!0),this.polygonOffsetFactor!==0&&(n.polygonOffsetFactor=this.polygonOffsetFactor),this.polygonOffsetUnits!==0&&(n.polygonOffsetUnits=this.polygonOffsetUnits),this.linewidth!==void 0&&this.linewidth!==1&&(n.linewidth=this.linewidth),this.dashSize!==void 0&&(n.dashSize=this.dashSize),this.gapSize!==void 0&&(n.gapSize=this.gapSize),this.scale!==void 0&&(n.scale=this.scale),this.dithering===!0&&(n.dithering=!0),this.alphaTest>0&&(n.alphaTest=this.alphaTest),this.alphaHash===!0&&(n.alphaHash=!0),this.alphaToCoverage===!0&&(n.alphaToCoverage=!0),this.premultipliedAlpha===!0&&(n.premultipliedAlpha=!0),this.forceSinglePass===!0&&(n.forceSinglePass=!0),this.wireframe===!0&&(n.wireframe=!0),this.wireframeLinewidth>1&&(n.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!=="round"&&(n.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!=="round"&&(n.wireframeLinejoin=this.wireframeLinejoin),this.flatShading===!0&&(n.flatShading=!0),this.visible===!1&&(n.visible=!1),this.toneMapped===!1&&(n.toneMapped=!1),this.fog===!1&&(n.fog=!1),Object.keys(this.userData).length>0&&(n.userData=this.userData);function r(s){let a=[];for(let o in s){let l=s[o];delete l.metadata,a.push(l)}return a}if(t){let s=r(e.textures),a=r(e.images);s.length>0&&(n.textures=s),a.length>0&&(n.images=a)}return n}clone(){return new this.constructor().copy(this)}copy(e){this.name=e.name,this.blending=e.blending,this.side=e.side,this.vertexColors=e.vertexColors,this.opacity=e.opacity,this.transparent=e.transparent,this.blendSrc=e.blendSrc,this.blendDst=e.blendDst,this.blendEquation=e.blendEquation,this.blendSrcAlpha=e.blendSrcAlpha,this.blendDstAlpha=e.blendDstAlpha,this.blendEquationAlpha=e.blendEquationAlpha,this.blendColor.copy(e.blendColor),this.blendAlpha=e.blendAlpha,this.depthFunc=e.depthFunc,this.depthTest=e.depthTest,this.depthWrite=e.depthWrite,this.stencilWriteMask=e.stencilWriteMask,this.stencilFunc=e.stencilFunc,this.stencilRef=e.stencilRef,this.stencilFuncMask=e.stencilFuncMask,this.stencilFail=e.stencilFail,this.stencilZFail=e.stencilZFail,this.stencilZPass=e.stencilZPass,this.stencilWrite=e.stencilWrite;let t=e.clippingPlanes,n=null;if(t!==null){let r=t.length;n=new Array(r);for(let s=0;s!==r;++s)n[s]=t[s].clone()}return this.clippingPlanes=n,this.clipIntersection=e.clipIntersection,this.clipShadows=e.clipShadows,this.shadowSide=e.shadowSide,this.colorWrite=e.colorWrite,this.precision=e.precision,this.polygonOffset=e.polygonOffset,this.polygonOffsetFactor=e.polygonOffsetFactor,this.polygonOffsetUnits=e.polygonOffsetUnits,this.dithering=e.dithering,this.alphaTest=e.alphaTest,this.alphaHash=e.alphaHash,this.alphaToCoverage=e.alphaToCoverage,this.premultipliedAlpha=e.premultipliedAlpha,this.forceSinglePass=e.forceSinglePass,this.visible=e.visible,this.toneMapped=e.toneMapped,this.userData=JSON.parse(JSON.stringify(e.userData)),this}dispose(){this.dispatchEvent({type:"dispose"})}set needsUpdate(e){e===!0&&this.version++}onBuild(){console.warn("Material: onBuild() has been removed.")}},Ks=class extends vi{static get type(){return"MeshBasicMaterial"}constructor(e){super(),this.isMeshBasicMaterial=!0,this.color=new ze(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new Zt,this.combine=eh,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.specularMap=e.specularMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.combine=e.combine,this.reflectivity=e.reflectivity,this.refractionRatio=e.refractionRatio,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.fog=e.fog,this}};var xt=new O,As=new we,$t=class{constructor(e,t,n=!1){if(Array.isArray(e))throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=!0,this.name="",this.array=e,this.itemSize=t,this.count=e!==void 0?e.length/t:0,this.normalized=n,this.usage=ef,this.updateRanges=[],this.gpuType=Ln,this.version=0}onUploadCallback(){}set needsUpdate(e){e===!0&&this.version++}setUsage(e){return this.usage=e,this}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}copy(e){return this.name=e.name,this.array=new e.array.constructor(e.array),this.itemSize=e.itemSize,this.count=e.count,this.normalized=e.normalized,this.usage=e.usage,this.gpuType=e.gpuType,this}copyAt(e,t,n){e*=this.itemSize,n*=t.itemSize;for(let r=0,s=this.itemSize;r<s;r++)this.array[e+r]=t.array[n+r];return this}copyArray(e){return this.array.set(e),this}applyMatrix3(e){if(this.itemSize===2)for(let t=0,n=this.count;t<n;t++)As.fromBufferAttribute(this,t),As.applyMatrix3(e),this.setXY(t,As.x,As.y);else if(this.itemSize===3)for(let t=0,n=this.count;t<n;t++)xt.fromBufferAttribute(this,t),xt.applyMatrix3(e),this.setXYZ(t,xt.x,xt.y,xt.z);return this}applyMatrix4(e){for(let t=0,n=this.count;t<n;t++)xt.fromBufferAttribute(this,t),xt.applyMatrix4(e),this.setXYZ(t,xt.x,xt.y,xt.z);return this}applyNormalMatrix(e){for(let t=0,n=this.count;t<n;t++)xt.fromBufferAttribute(this,t),xt.applyNormalMatrix(e),this.setXYZ(t,xt.x,xt.y,xt.z);return this}transformDirection(e){for(let t=0,n=this.count;t<n;t++)xt.fromBufferAttribute(this,t),xt.transformDirection(e),this.setXYZ(t,xt.x,xt.y,xt.z);return this}set(e,t=0){return this.array.set(e,t),this}getComponent(e,t){let n=this.array[e*this.itemSize+t];return this.normalized&&(n=Qi(n,this.array)),n}setComponent(e,t,n){return this.normalized&&(n=It(n,this.array)),this.array[e*this.itemSize+t]=n,this}getX(e){let t=this.array[e*this.itemSize];return this.normalized&&(t=Qi(t,this.array)),t}setX(e,t){return this.normalized&&(t=It(t,this.array)),this.array[e*this.itemSize]=t,this}getY(e){let t=this.array[e*this.itemSize+1];return this.normalized&&(t=Qi(t,this.array)),t}setY(e,t){return this.normalized&&(t=It(t,this.array)),this.array[e*this.itemSize+1]=t,this}getZ(e){let t=this.array[e*this.itemSize+2];return this.normalized&&(t=Qi(t,this.array)),t}setZ(e,t){return this.normalized&&(t=It(t,this.array)),this.array[e*this.itemSize+2]=t,this}getW(e){let t=this.array[e*this.itemSize+3];return this.normalized&&(t=Qi(t,this.array)),t}setW(e,t){return this.normalized&&(t=It(t,this.array)),this.array[e*this.itemSize+3]=t,this}setXY(e,t,n){return e*=this.itemSize,this.normalized&&(t=It(t,this.array),n=It(n,this.array)),this.array[e+0]=t,this.array[e+1]=n,this}setXYZ(e,t,n,r){return e*=this.itemSize,this.normalized&&(t=It(t,this.array),n=It(n,this.array),r=It(r,this.array)),this.array[e+0]=t,this.array[e+1]=n,this.array[e+2]=r,this}setXYZW(e,t,n,r,s){return e*=this.itemSize,this.normalized&&(t=It(t,this.array),n=It(n,this.array),r=It(r,this.array),s=It(s,this.array)),this.array[e+0]=t,this.array[e+1]=n,this.array[e+2]=r,this.array[e+3]=s,this}onUpload(e){return this.onUploadCallback=e,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){let e={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return this.name!==""&&(e.name=this.name),this.usage!==ef&&(e.usage=this.usage),e}};var Js=class extends $t{constructor(e,t,n){super(new Uint16Array(e),t,n)}};var js=class extends $t{constructor(e,t,n){super(new Uint32Array(e),t,n)}};var mt=class extends $t{constructor(e,t,n){super(new Float32Array(e),t,n)}},rm=0,Yt=new dt,el=new Ut,Zi=new O,Vt=new yi,Nr=new yi,Mt=new O,cn=class i extends On{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:rm++}),this.uuid=gr(),this.name="",this.type="BufferGeometry",this.index=null,this.indirect=null,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={}}getIndex(){return this.index}setIndex(e){return Array.isArray(e)?this.index=new(mh(e)?js:Js)(e,1):this.index=e,this}setIndirect(e){return this.indirect=e,this}getIndirect(){return this.indirect}getAttribute(e){return this.attributes[e]}setAttribute(e,t){return this.attributes[e]=t,this}deleteAttribute(e){return delete this.attributes[e],this}hasAttribute(e){return this.attributes[e]!==void 0}addGroup(e,t,n=0){this.groups.push({start:e,count:t,materialIndex:n})}clearGroups(){this.groups=[]}setDrawRange(e,t){this.drawRange.start=e,this.drawRange.count=t}applyMatrix4(e){let t=this.attributes.position;t!==void 0&&(t.applyMatrix4(e),t.needsUpdate=!0);let n=this.attributes.normal;if(n!==void 0){let s=new Ne().getNormalMatrix(e);n.applyNormalMatrix(s),n.needsUpdate=!0}let r=this.attributes.tangent;return r!==void 0&&(r.transformDirection(e),r.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this}applyQuaternion(e){return Yt.makeRotationFromQuaternion(e),this.applyMatrix4(Yt),this}rotateX(e){return Yt.makeRotationX(e),this.applyMatrix4(Yt),this}rotateY(e){return Yt.makeRotationY(e),this.applyMatrix4(Yt),this}rotateZ(e){return Yt.makeRotationZ(e),this.applyMatrix4(Yt),this}translate(e,t,n){return Yt.makeTranslation(e,t,n),this.applyMatrix4(Yt),this}scale(e,t,n){return Yt.makeScale(e,t,n),this.applyMatrix4(Yt),this}lookAt(e){return el.lookAt(e),el.updateMatrix(),this.applyMatrix4(el.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(Zi).negate(),this.translate(Zi.x,Zi.y,Zi.z),this}setFromPoints(e){let t=this.getAttribute("position");if(t===void 0){let n=[];for(let r=0,s=e.length;r<s;r++){let a=e[r];n.push(a.x,a.y,a.z||0)}this.setAttribute("position",new mt(n,3))}else{for(let n=0,r=t.count;n<r;n++){let s=e[n];t.setXYZ(n,s.x,s.y,s.z||0)}e.length>t.count&&console.warn("THREE.BufferGeometry: Buffer size too small for points data. Use .dispose() and create a new geometry."),t.needsUpdate=!0}return this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new yi);let e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){console.error("THREE.BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.",this),this.boundingBox.set(new O(-1/0,-1/0,-1/0),new O(1/0,1/0,1/0));return}if(e!==void 0){if(this.boundingBox.setFromBufferAttribute(e),t)for(let n=0,r=t.length;n<r;n++){let s=t[n];Vt.setFromBufferAttribute(s),this.morphTargetsRelative?(Mt.addVectors(this.boundingBox.min,Vt.min),this.boundingBox.expandByPoint(Mt),Mt.addVectors(this.boundingBox.max,Vt.max),this.boundingBox.expandByPoint(Mt)):(this.boundingBox.expandByPoint(Vt.min),this.boundingBox.expandByPoint(Vt.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&console.error('THREE.BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',this)}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new Gr);let e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){console.error("THREE.BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.",this),this.boundingSphere.set(new O,1/0);return}if(e){let n=this.boundingSphere.center;if(Vt.setFromBufferAttribute(e),t)for(let s=0,a=t.length;s<a;s++){let o=t[s];Nr.setFromBufferAttribute(o),this.morphTargetsRelative?(Mt.addVectors(Vt.min,Nr.min),Vt.expandByPoint(Mt),Mt.addVectors(Vt.max,Nr.max),Vt.expandByPoint(Mt)):(Vt.expandByPoint(Nr.min),Vt.expandByPoint(Nr.max))}Vt.getCenter(n);let r=0;for(let s=0,a=e.count;s<a;s++)Mt.fromBufferAttribute(e,s),r=Math.max(r,n.distanceToSquared(Mt));if(t)for(let s=0,a=t.length;s<a;s++){let o=t[s],l=this.morphTargetsRelative;for(let c=0,u=o.count;c<u;c++)Mt.fromBufferAttribute(o,c),l&&(Zi.fromBufferAttribute(e,c),Mt.add(Zi)),r=Math.max(r,n.distanceToSquared(Mt))}this.boundingSphere.radius=Math.sqrt(r),isNaN(this.boundingSphere.radius)&&console.error('THREE.BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',this)}}computeTangents(){let e=this.index,t=this.attributes;if(e===null||t.position===void 0||t.normal===void 0||t.uv===void 0){console.error("THREE.BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");return}let n=t.position,r=t.normal,s=t.uv;this.hasAttribute("tangent")===!1&&this.setAttribute("tangent",new $t(new Float32Array(4*n.count),4));let a=this.getAttribute("tangent"),o=[],l=[];for(let D=0;D<n.count;D++)o[D]=new O,l[D]=new O;let c=new O,u=new O,f=new O,d=new we,p=new we,g=new we,_=new O,m=new O;function h(D,b,S){c.fromBufferAttribute(n,D),u.fromBufferAttribute(n,b),f.fromBufferAttribute(n,S),d.fromBufferAttribute(s,D),p.fromBufferAttribute(s,b),g.fromBufferAttribute(s,S),u.sub(c),f.sub(c),p.sub(d),g.sub(d);let R=1/(p.x*g.y-g.x*p.y);isFinite(R)&&(_.copy(u).multiplyScalar(g.y).addScaledVector(f,-p.y).multiplyScalar(R),m.copy(f).multiplyScalar(p.x).addScaledVector(u,-g.x).multiplyScalar(R),o[D].add(_),o[b].add(_),o[S].add(_),l[D].add(m),l[b].add(m),l[S].add(m))}let T=this.groups;T.length===0&&(T=[{start:0,count:e.count}]);for(let D=0,b=T.length;D<b;++D){let S=T[D],R=S.start,V=S.count;for(let z=R,X=R+V;z<X;z+=3)h(e.getX(z+0),e.getX(z+1),e.getX(z+2))}let w=new O,M=new O,N=new O,A=new O;function C(D){N.fromBufferAttribute(r,D),A.copy(N);let b=o[D];w.copy(b),w.sub(N.multiplyScalar(N.dot(b))).normalize(),M.crossVectors(A,b);let R=M.dot(l[D])<0?-1:1;a.setXYZW(D,w.x,w.y,w.z,R)}for(let D=0,b=T.length;D<b;++D){let S=T[D],R=S.start,V=S.count;for(let z=R,X=R+V;z<X;z+=3)C(e.getX(z+0)),C(e.getX(z+1)),C(e.getX(z+2))}}computeVertexNormals(){let e=this.index,t=this.getAttribute("position");if(t!==void 0){let n=this.getAttribute("normal");if(n===void 0)n=new $t(new Float32Array(t.count*3),3),this.setAttribute("normal",n);else for(let d=0,p=n.count;d<p;d++)n.setXYZ(d,0,0,0);let r=new O,s=new O,a=new O,o=new O,l=new O,c=new O,u=new O,f=new O;if(e)for(let d=0,p=e.count;d<p;d+=3){let g=e.getX(d+0),_=e.getX(d+1),m=e.getX(d+2);r.fromBufferAttribute(t,g),s.fromBufferAttribute(t,_),a.fromBufferAttribute(t,m),u.subVectors(a,s),f.subVectors(r,s),u.cross(f),o.fromBufferAttribute(n,g),l.fromBufferAttribute(n,_),c.fromBufferAttribute(n,m),o.add(u),l.add(u),c.add(u),n.setXYZ(g,o.x,o.y,o.z),n.setXYZ(_,l.x,l.y,l.z),n.setXYZ(m,c.x,c.y,c.z)}else for(let d=0,p=t.count;d<p;d+=3)r.fromBufferAttribute(t,d+0),s.fromBufferAttribute(t,d+1),a.fromBufferAttribute(t,d+2),u.subVectors(a,s),f.subVectors(r,s),u.cross(f),n.setXYZ(d+0,u.x,u.y,u.z),n.setXYZ(d+1,u.x,u.y,u.z),n.setXYZ(d+2,u.x,u.y,u.z);this.normalizeNormals(),n.needsUpdate=!0}}normalizeNormals(){let e=this.attributes.normal;for(let t=0,n=e.count;t<n;t++)Mt.fromBufferAttribute(e,t),Mt.normalize(),e.setXYZ(t,Mt.x,Mt.y,Mt.z)}toNonIndexed(){function e(o,l){let c=o.array,u=o.itemSize,f=o.normalized,d=new c.constructor(l.length*u),p=0,g=0;for(let _=0,m=l.length;_<m;_++){o.isInterleavedBufferAttribute?p=l[_]*o.data.stride+o.offset:p=l[_]*u;for(let h=0;h<u;h++)d[g++]=c[p++]}return new $t(d,u,f)}if(this.index===null)return console.warn("THREE.BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."),this;let t=new i,n=this.index.array,r=this.attributes;for(let o in r){let l=r[o],c=e(l,n);t.setAttribute(o,c)}let s=this.morphAttributes;for(let o in s){let l=[],c=s[o];for(let u=0,f=c.length;u<f;u++){let d=c[u],p=e(d,n);l.push(p)}t.morphAttributes[o]=l}t.morphTargetsRelative=this.morphTargetsRelative;let a=this.groups;for(let o=0,l=a.length;o<l;o++){let c=a[o];t.addGroup(c.start,c.count,c.materialIndex)}return t}toJSON(){let e={metadata:{version:4.6,type:"BufferGeometry",generator:"BufferGeometry.toJSON"}};if(e.uuid=this.uuid,e.type=this.type,this.name!==""&&(e.name=this.name),Object.keys(this.userData).length>0&&(e.userData=this.userData),this.parameters!==void 0){let l=this.parameters;for(let c in l)l[c]!==void 0&&(e[c]=l[c]);return e}e.data={attributes:{}};let t=this.index;t!==null&&(e.data.index={type:t.array.constructor.name,array:Array.prototype.slice.call(t.array)});let n=this.attributes;for(let l in n){let c=n[l];e.data.attributes[l]=c.toJSON(e.data)}let r={},s=!1;for(let l in this.morphAttributes){let c=this.morphAttributes[l],u=[];for(let f=0,d=c.length;f<d;f++){let p=c[f];u.push(p.toJSON(e.data))}u.length>0&&(r[l]=u,s=!0)}s&&(e.data.morphAttributes=r,e.data.morphTargetsRelative=this.morphTargetsRelative);let a=this.groups;a.length>0&&(e.data.groups=JSON.parse(JSON.stringify(a)));let o=this.boundingSphere;return o!==null&&(e.data.boundingSphere={center:o.center.toArray(),radius:o.radius}),e}clone(){return new this.constructor().copy(this)}copy(e){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;let t={};this.name=e.name;let n=e.index;n!==null&&this.setIndex(n.clone(t));let r=e.attributes;for(let c in r){let u=r[c];this.setAttribute(c,u.clone(t))}let s=e.morphAttributes;for(let c in s){let u=[],f=s[c];for(let d=0,p=f.length;d<p;d++)u.push(f[d].clone(t));this.morphAttributes[c]=u}this.morphTargetsRelative=e.morphTargetsRelative;let a=e.groups;for(let c=0,u=a.length;c<u;c++){let f=a[c];this.addGroup(f.start,f.count,f.materialIndex)}let o=e.boundingBox;o!==null&&(this.boundingBox=o.clone());let l=e.boundingSphere;return l!==null&&(this.boundingSphere=l.clone()),this.drawRange.start=e.drawRange.start,this.drawRange.count=e.drawRange.count,this.userData=e.userData,this}dispose(){this.dispatchEvent({type:"dispose"})}},yf=new dt,li=new ur,Cs=new Gr,vf=new O,Rs=new O,Ps=new O,Is=new O,tl=new O,Ls=new O,Sf=new O,Ds=new O,Qe=class extends Ut{constructor(e=new cn,t=new Ks){super(),this.isMesh=!0,this.type="Mesh",this.geometry=e,this.material=t,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),e.morphTargetInfluences!==void 0&&(this.morphTargetInfluences=e.morphTargetInfluences.slice()),e.morphTargetDictionary!==void 0&&(this.morphTargetDictionary=Object.assign({},e.morphTargetDictionary)),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}updateMorphTargets(){let t=this.geometry.morphAttributes,n=Object.keys(t);if(n.length>0){let r=t[n[0]];if(r!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let s=0,a=r.length;s<a;s++){let o=r[s].name||String(s);this.morphTargetInfluences.push(0),this.morphTargetDictionary[o]=s}}}}getVertexPosition(e,t){let n=this.geometry,r=n.attributes.position,s=n.morphAttributes.position,a=n.morphTargetsRelative;t.fromBufferAttribute(r,e);let o=this.morphTargetInfluences;if(s&&o){Ls.set(0,0,0);for(let l=0,c=s.length;l<c;l++){let u=o[l],f=s[l];u!==0&&(tl.fromBufferAttribute(f,e),a?Ls.addScaledVector(tl,u):Ls.addScaledVector(tl.sub(t),u))}t.add(Ls)}return t}raycast(e,t){let n=this.geometry,r=this.material,s=this.matrixWorld;r!==void 0&&(n.boundingSphere===null&&n.computeBoundingSphere(),Cs.copy(n.boundingSphere),Cs.applyMatrix4(s),li.copy(e.ray).recast(e.near),!(Cs.containsPoint(li.origin)===!1&&(li.intersectSphere(Cs,vf)===null||li.origin.distanceToSquared(vf)>(e.far-e.near)**2))&&(yf.copy(s).invert(),li.copy(e.ray).applyMatrix4(yf),!(n.boundingBox!==null&&li.intersectsBox(n.boundingBox)===!1)&&this._computeIntersections(e,t,li)))}_computeIntersections(e,t,n){let r,s=this.geometry,a=this.material,o=s.index,l=s.attributes.position,c=s.attributes.uv,u=s.attributes.uv1,f=s.attributes.normal,d=s.groups,p=s.drawRange;if(o!==null)if(Array.isArray(a))for(let g=0,_=d.length;g<_;g++){let m=d[g],h=a[m.materialIndex],T=Math.max(m.start,p.start),w=Math.min(o.count,Math.min(m.start+m.count,p.start+p.count));for(let M=T,N=w;M<N;M+=3){let A=o.getX(M),C=o.getX(M+1),D=o.getX(M+2);r=Us(this,h,e,n,c,u,f,A,C,D),r&&(r.faceIndex=Math.floor(M/3),r.face.materialIndex=m.materialIndex,t.push(r))}}else{let g=Math.max(0,p.start),_=Math.min(o.count,p.start+p.count);for(let m=g,h=_;m<h;m+=3){let T=o.getX(m),w=o.getX(m+1),M=o.getX(m+2);r=Us(this,a,e,n,c,u,f,T,w,M),r&&(r.faceIndex=Math.floor(m/3),t.push(r))}}else if(l!==void 0)if(Array.isArray(a))for(let g=0,_=d.length;g<_;g++){let m=d[g],h=a[m.materialIndex],T=Math.max(m.start,p.start),w=Math.min(l.count,Math.min(m.start+m.count,p.start+p.count));for(let M=T,N=w;M<N;M+=3){let A=M,C=M+1,D=M+2;r=Us(this,h,e,n,c,u,f,A,C,D),r&&(r.faceIndex=Math.floor(M/3),r.face.materialIndex=m.materialIndex,t.push(r))}}else{let g=Math.max(0,p.start),_=Math.min(l.count,p.start+p.count);for(let m=g,h=_;m<h;m+=3){let T=m,w=m+1,M=m+2;r=Us(this,a,e,n,c,u,f,T,w,M),r&&(r.faceIndex=Math.floor(m/3),t.push(r))}}}};function sm(i,e,t,n,r,s,a,o){let l;if(e.side===Ot?l=n.intersectTriangle(a,s,r,!0,o):l=n.intersectTriangle(r,s,a,e.side===ei,o),l===null)return null;Ds.copy(o),Ds.applyMatrix4(i.matrixWorld);let c=t.ray.origin.distanceTo(Ds);return c<t.near||c>t.far?null:{distance:c,point:Ds.clone(),object:i}}function Us(i,e,t,n,r,s,a,o,l,c){i.getVertexPosition(o,Rs),i.getVertexPosition(l,Ps),i.getVertexPosition(c,Is);let u=sm(i,e,t,n,Rs,Ps,Is,Sf);if(u){let f=new O;pi.getBarycoord(Sf,Rs,Ps,Is,f),r&&(u.uv=pi.getInterpolatedAttribute(r,o,l,c,f,new we)),s&&(u.uv1=pi.getInterpolatedAttribute(s,o,l,c,f,new we)),a&&(u.normal=pi.getInterpolatedAttribute(a,o,l,c,f,new O),u.normal.dot(n.direction)>0&&u.normal.multiplyScalar(-1));let d={a:o,b:l,c,normal:new O,materialIndex:0};pi.getNormal(Rs,Ps,Is,d.normal),u.face=d,u.barycoord=f}return u}var Kt=class i extends cn{constructor(e=1,t=1,n=1,r=1,s=1,a=1){super(),this.type="BoxGeometry",this.parameters={width:e,height:t,depth:n,widthSegments:r,heightSegments:s,depthSegments:a};let o=this;r=Math.floor(r),s=Math.floor(s),a=Math.floor(a);let l=[],c=[],u=[],f=[],d=0,p=0;g("z","y","x",-1,-1,n,t,e,a,s,0),g("z","y","x",1,-1,n,t,-e,a,s,1),g("x","z","y",1,1,e,n,t,r,a,2),g("x","z","y",1,-1,e,n,-t,r,a,3),g("x","y","z",1,-1,e,t,n,r,s,4),g("x","y","z",-1,-1,e,t,-n,r,s,5),this.setIndex(l),this.setAttribute("position",new mt(c,3)),this.setAttribute("normal",new mt(u,3)),this.setAttribute("uv",new mt(f,2));function g(_,m,h,T,w,M,N,A,C,D,b){let S=M/C,R=N/D,V=M/2,z=N/2,X=A/2,J=C+1,q=D+1,te=0,W=0,se=new O;for(let fe=0;fe<q;fe++){let Me=fe*R-z;for(let Be=0;Be<J;Be++){let tt=Be*S-V;se[_]=tt*T,se[m]=Me*w,se[h]=X,c.push(se.x,se.y,se.z),se[_]=0,se[m]=0,se[h]=A>0?1:-1,u.push(se.x,se.y,se.z),f.push(Be/C),f.push(1-fe/D),te+=1}}for(let fe=0;fe<D;fe++)for(let Me=0;Me<C;Me++){let Be=d+Me+J*fe,tt=d+Me+J*(fe+1),$=d+(Me+1)+J*(fe+1),ne=d+(Me+1)+J*fe;l.push(Be,tt,ne),l.push(tt,$,ne),W+=6}o.addGroup(p,W,b),p+=W,d+=te}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new i(e.width,e.height,e.depth,e.widthSegments,e.heightSegments,e.depthSegments)}};function fr(i){let e={};for(let t in i){e[t]={};for(let n in i[t]){let r=i[t][n];r&&(r.isColor||r.isMatrix3||r.isMatrix4||r.isVector2||r.isVector3||r.isVector4||r.isTexture||r.isQuaternion)?r.isRenderTargetTexture?(console.warn("UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms()."),e[t][n]=null):e[t][n]=r.clone():Array.isArray(r)?e[t][n]=r.slice():e[t][n]=r}}return e}function Lt(i){let e={};for(let t=0;t<i.length;t++){let n=fr(i[t]);for(let r in n)e[r]=n[r]}return e}function am(i){let e=[];for(let t=0;t<i.length;t++)e.push(i[t].clone());return e}function xh(i){let e=i.getRenderTarget();return e===null?i.outputColorSpace:e.isXRRenderTarget===!0?e.texture.colorSpace:Ye.workingColorSpace}var om={clone:fr,merge:Lt},lm=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,cm=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`,xn=class extends vi{static get type(){return"ShaderMaterial"}constructor(e){super(),this.isShaderMaterial=!0,this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=lm,this.fragmentShader=cm,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={clipCullDistance:!1,multiDraw:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,e!==void 0&&this.setValues(e)}copy(e){return super.copy(e),this.fragmentShader=e.fragmentShader,this.vertexShader=e.vertexShader,this.uniforms=fr(e.uniforms),this.uniformsGroups=am(e.uniformsGroups),this.defines=Object.assign({},e.defines),this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.fog=e.fog,this.lights=e.lights,this.clipping=e.clipping,this.extensions=Object.assign({},e.extensions),this.glslVersion=e.glslVersion,this}toJSON(e){let t=super.toJSON(e);t.glslVersion=this.glslVersion,t.uniforms={};for(let r in this.uniforms){let a=this.uniforms[r].value;a&&a.isTexture?t.uniforms[r]={type:"t",value:a.toJSON(e).uuid}:a&&a.isColor?t.uniforms[r]={type:"c",value:a.getHex()}:a&&a.isVector2?t.uniforms[r]={type:"v2",value:a.toArray()}:a&&a.isVector3?t.uniforms[r]={type:"v3",value:a.toArray()}:a&&a.isVector4?t.uniforms[r]={type:"v4",value:a.toArray()}:a&&a.isMatrix3?t.uniforms[r]={type:"m3",value:a.toArray()}:a&&a.isMatrix4?t.uniforms[r]={type:"m4",value:a.toArray()}:t.uniforms[r]={value:a}}Object.keys(this.defines).length>0&&(t.defines=this.defines),t.vertexShader=this.vertexShader,t.fragmentShader=this.fragmentShader,t.lights=this.lights,t.clipping=this.clipping;let n={};for(let r in this.extensions)this.extensions[r]===!0&&(n[r]=!0);return Object.keys(n).length>0&&(t.extensions=n),t}},Qs=class extends Ut{constructor(){super(),this.isCamera=!0,this.type="Camera",this.matrixWorldInverse=new dt,this.projectionMatrix=new dt,this.projectionMatrixInverse=new dt,this.coordinateSystem=Dn}copy(e,t){return super.copy(e,t),this.matrixWorldInverse.copy(e.matrixWorldInverse),this.projectionMatrix.copy(e.projectionMatrix),this.projectionMatrixInverse.copy(e.projectionMatrixInverse),this.coordinateSystem=e.coordinateSystem,this}getWorldDirection(e){return super.getWorldDirection(e).negate()}updateMatrixWorld(e){super.updateMatrixWorld(e),this.matrixWorldInverse.copy(this.matrixWorld).invert()}updateWorldMatrix(e,t){super.updateWorldMatrix(e,t),this.matrixWorldInverse.copy(this.matrixWorld).invert()}clone(){return new this.constructor().copy(this)}},Kn=new O,Mf=new we,bf=new we,Dt=class extends Qs{constructor(e=50,t=1,n=.1,r=2e3){super(),this.isPerspectiveCamera=!0,this.type="PerspectiveCamera",this.fov=e,this.zoom=1,this.near=n,this.far=r,this.focus=10,this.aspect=t,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.fov=e.fov,this.zoom=e.zoom,this.near=e.near,this.far=e.far,this.focus=e.focus,this.aspect=e.aspect,this.view=e.view===null?null:Object.assign({},e.view),this.filmGauge=e.filmGauge,this.filmOffset=e.filmOffset,this}setFocalLength(e){let t=.5*this.getFilmHeight()/e;this.fov=Vr*2*Math.atan(t),this.updateProjectionMatrix()}getFocalLength(){let e=Math.tan(Br*.5*this.fov);return .5*this.getFilmHeight()/e}getEffectiveFOV(){return Vr*2*Math.atan(Math.tan(Br*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}getViewBounds(e,t,n){Kn.set(-1,-1,.5).applyMatrix4(this.projectionMatrixInverse),t.set(Kn.x,Kn.y).multiplyScalar(-e/Kn.z),Kn.set(1,1,.5).applyMatrix4(this.projectionMatrixInverse),n.set(Kn.x,Kn.y).multiplyScalar(-e/Kn.z)}getViewSize(e,t){return this.getViewBounds(e,Mf,bf),t.subVectors(bf,Mf)}setViewOffset(e,t,n,r,s,a){this.aspect=e/t,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=n,this.view.offsetY=r,this.view.width=s,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let e=this.near,t=e*Math.tan(Br*.5*this.fov)/this.zoom,n=2*t,r=this.aspect*n,s=-.5*r,a=this.view;if(this.view!==null&&this.view.enabled){let l=a.fullWidth,c=a.fullHeight;s+=a.offsetX*r/l,t-=a.offsetY*n/c,r*=a.width/l,n*=a.height/c}let o=this.filmOffset;o!==0&&(s+=e*o/this.getFilmWidth()),this.projectionMatrix.makePerspective(s,s+r,t,t-n,e,this.far,this.coordinateSystem),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){let t=super.toJSON(e);return t.object.fov=this.fov,t.object.zoom=this.zoom,t.object.near=this.near,t.object.far=this.far,t.object.focus=this.focus,t.object.aspect=this.aspect,this.view!==null&&(t.object.view=Object.assign({},this.view)),t.object.filmGauge=this.filmGauge,t.object.filmOffset=this.filmOffset,t}},Ki=-90,Ji=1,Ql=class extends Ut{constructor(e,t,n){super(),this.type="CubeCamera",this.renderTarget=n,this.coordinateSystem=null,this.activeMipmapLevel=0;let r=new Dt(Ki,Ji,e,t);r.layers=this.layers,this.add(r);let s=new Dt(Ki,Ji,e,t);s.layers=this.layers,this.add(s);let a=new Dt(Ki,Ji,e,t);a.layers=this.layers,this.add(a);let o=new Dt(Ki,Ji,e,t);o.layers=this.layers,this.add(o);let l=new Dt(Ki,Ji,e,t);l.layers=this.layers,this.add(l);let c=new Dt(Ki,Ji,e,t);c.layers=this.layers,this.add(c)}updateCoordinateSystem(){let e=this.coordinateSystem,t=this.children.concat(),[n,r,s,a,o,l]=t;for(let c of t)this.remove(c);if(e===Dn)n.up.set(0,1,0),n.lookAt(1,0,0),r.up.set(0,1,0),r.lookAt(-1,0,0),s.up.set(0,0,-1),s.lookAt(0,1,0),a.up.set(0,0,1),a.lookAt(0,-1,0),o.up.set(0,1,0),o.lookAt(0,0,1),l.up.set(0,1,0),l.lookAt(0,0,-1);else if(e===qs)n.up.set(0,-1,0),n.lookAt(-1,0,0),r.up.set(0,-1,0),r.lookAt(1,0,0),s.up.set(0,0,1),s.lookAt(0,1,0),a.up.set(0,0,-1),a.lookAt(0,-1,0),o.up.set(0,-1,0),o.lookAt(0,0,1),l.up.set(0,-1,0),l.lookAt(0,0,-1);else throw new Error("THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: "+e);for(let c of t)this.add(c),c.updateMatrixWorld()}update(e,t){this.parent===null&&this.updateMatrixWorld();let{renderTarget:n,activeMipmapLevel:r}=this;this.coordinateSystem!==e.coordinateSystem&&(this.coordinateSystem=e.coordinateSystem,this.updateCoordinateSystem());let[s,a,o,l,c,u]=this.children,f=e.getRenderTarget(),d=e.getActiveCubeFace(),p=e.getActiveMipmapLevel(),g=e.xr.enabled;e.xr.enabled=!1;let _=n.texture.generateMipmaps;n.texture.generateMipmaps=!1,e.setRenderTarget(n,0,r),e.render(t,s),e.setRenderTarget(n,1,r),e.render(t,a),e.setRenderTarget(n,2,r),e.render(t,o),e.setRenderTarget(n,3,r),e.render(t,l),e.setRenderTarget(n,4,r),e.render(t,c),n.texture.generateMipmaps=_,e.setRenderTarget(n,5,r),e.render(t,u),e.setRenderTarget(f,d,p),e.xr.enabled=g,n.texture.needsPMREMUpdate=!0}},ea=class extends Gt{constructor(e,t,n,r,s,a,o,l,c,u){e=e!==void 0?e:[],t=t!==void 0?t:ar,super(e,t,n,r,s,a,o,l,c,u),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(e){this.image=e}},ec=class extends Fn{constructor(e=1,t={}){super(e,e,t),this.isWebGLCubeRenderTarget=!0;let n={width:e,height:e,depth:1},r=[n,n,n,n,n,n];this.texture=new ea(r,t.mapping,t.wrapS,t.wrapT,t.magFilter,t.minFilter,t.format,t.type,t.anisotropy,t.colorSpace),this.texture.isRenderTargetTexture=!0,this.texture.generateMipmaps=t.generateMipmaps!==void 0?t.generateMipmaps:!1,this.texture.minFilter=t.minFilter!==void 0?t.minFilter:mn}fromEquirectangularTexture(e,t){this.texture.type=t.type,this.texture.colorSpace=t.colorSpace,this.texture.generateMipmaps=t.generateMipmaps,this.texture.minFilter=t.minFilter,this.texture.magFilter=t.magFilter;let n={uniforms:{tEquirect:{value:null}},vertexShader:`

				varying vec3 vWorldDirection;

				vec3 transformDirection( in vec3 dir, in mat4 matrix ) {

					return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );

				}

				void main() {

					vWorldDirection = transformDirection( position, modelMatrix );

					#include <begin_vertex>
					#include <project_vertex>

				}
			`,fragmentShader:`

				uniform sampler2D tEquirect;

				varying vec3 vWorldDirection;

				#include <common>

				void main() {

					vec3 direction = normalize( vWorldDirection );

					vec2 sampleUV = equirectUv( direction );

					gl_FragColor = texture2D( tEquirect, sampleUV );

				}
			`},r=new Kt(5,5,5),s=new xn({name:"CubemapFromEquirect",uniforms:fr(n.uniforms),vertexShader:n.vertexShader,fragmentShader:n.fragmentShader,side:Ot,blending:jn});s.uniforms.tEquirect.value=t;let a=new Qe(r,s),o=t.minFilter;return t.minFilter===xi&&(t.minFilter=mn),new Ql(1,10,this).update(e,a),t.minFilter=o,a.geometry.dispose(),a.material.dispose(),this}clear(e,t,n,r){let s=e.getRenderTarget();for(let a=0;a<6;a++)e.setRenderTarget(this,a),e.clear(t,n,r);e.setRenderTarget(s)}},nl=new O,um=new O,fm=new Ne,sn=class{constructor(e=new O(1,0,0),t=0){this.isPlane=!0,this.normal=e,this.constant=t}set(e,t){return this.normal.copy(e),this.constant=t,this}setComponents(e,t,n,r){return this.normal.set(e,t,n),this.constant=r,this}setFromNormalAndCoplanarPoint(e,t){return this.normal.copy(e),this.constant=-t.dot(this.normal),this}setFromCoplanarPoints(e,t,n){let r=nl.subVectors(n,t).cross(um.subVectors(e,t)).normalize();return this.setFromNormalAndCoplanarPoint(r,e),this}copy(e){return this.normal.copy(e.normal),this.constant=e.constant,this}normalize(){let e=1/this.normal.length();return this.normal.multiplyScalar(e),this.constant*=e,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(e){return this.normal.dot(e)+this.constant}distanceToSphere(e){return this.distanceToPoint(e.center)-e.radius}projectPoint(e,t){return t.copy(e).addScaledVector(this.normal,-this.distanceToPoint(e))}intersectLine(e,t){let n=e.delta(nl),r=this.normal.dot(n);if(r===0)return this.distanceToPoint(e.start)===0?t.copy(e.start):null;let s=-(e.start.dot(this.normal)+this.constant)/r;return s<0||s>1?null:t.copy(e.start).addScaledVector(n,s)}intersectsLine(e){let t=this.distanceToPoint(e.start),n=this.distanceToPoint(e.end);return t<0&&n>0||n<0&&t>0}intersectsBox(e){return e.intersectsPlane(this)}intersectsSphere(e){return e.intersectsPlane(this)}coplanarPoint(e){return e.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(e,t){let n=t||fm.getNormalMatrix(e),r=this.coplanarPoint(nl).applyMatrix4(e),s=this.normal.applyMatrix3(n).normalize();return this.constant=-r.dot(s),this}translate(e){return this.constant-=e.dot(this.normal),this}equals(e){return e.normal.equals(this.normal)&&e.constant===this.constant}clone(){return new this.constructor().copy(this)}},ci=new Gr,Ns=new O,Xr=class{constructor(e=new sn,t=new sn,n=new sn,r=new sn,s=new sn,a=new sn){this.planes=[e,t,n,r,s,a]}set(e,t,n,r,s,a){let o=this.planes;return o[0].copy(e),o[1].copy(t),o[2].copy(n),o[3].copy(r),o[4].copy(s),o[5].copy(a),this}copy(e){let t=this.planes;for(let n=0;n<6;n++)t[n].copy(e.planes[n]);return this}setFromProjectionMatrix(e,t=Dn){let n=this.planes,r=e.elements,s=r[0],a=r[1],o=r[2],l=r[3],c=r[4],u=r[5],f=r[6],d=r[7],p=r[8],g=r[9],_=r[10],m=r[11],h=r[12],T=r[13],w=r[14],M=r[15];if(n[0].setComponents(l-s,d-c,m-p,M-h).normalize(),n[1].setComponents(l+s,d+c,m+p,M+h).normalize(),n[2].setComponents(l+a,d+u,m+g,M+T).normalize(),n[3].setComponents(l-a,d-u,m-g,M-T).normalize(),n[4].setComponents(l-o,d-f,m-_,M-w).normalize(),t===Dn)n[5].setComponents(l+o,d+f,m+_,M+w).normalize();else if(t===qs)n[5].setComponents(o,f,_,w).normalize();else throw new Error("THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: "+t);return this}intersectsObject(e){if(e.boundingSphere!==void 0)e.boundingSphere===null&&e.computeBoundingSphere(),ci.copy(e.boundingSphere).applyMatrix4(e.matrixWorld);else{let t=e.geometry;t.boundingSphere===null&&t.computeBoundingSphere(),ci.copy(t.boundingSphere).applyMatrix4(e.matrixWorld)}return this.intersectsSphere(ci)}intersectsSprite(e){return ci.center.set(0,0,0),ci.radius=.7071067811865476,ci.applyMatrix4(e.matrixWorld),this.intersectsSphere(ci)}intersectsSphere(e){let t=this.planes,n=e.center,r=-e.radius;for(let s=0;s<6;s++)if(t[s].distanceToPoint(n)<r)return!1;return!0}intersectsBox(e){let t=this.planes;for(let n=0;n<6;n++){let r=t[n];if(Ns.x=r.normal.x>0?e.max.x:e.min.x,Ns.y=r.normal.y>0?e.max.y:e.min.y,Ns.z=r.normal.z>0?e.max.z:e.min.z,r.distanceToPoint(Ns)<0)return!1}return!0}containsPoint(e){let t=this.planes;for(let n=0;n<6;n++)if(t[n].distanceToPoint(e)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}};function _h(){let i=null,e=!1,t=null,n=null;function r(s,a){t(s,a),n=i.requestAnimationFrame(r)}return{start:function(){e!==!0&&t!==null&&(n=i.requestAnimationFrame(r),e=!0)},stop:function(){i.cancelAnimationFrame(n),e=!1},setAnimationLoop:function(s){t=s},setContext:function(s){i=s}}}function hm(i){let e=new WeakMap;function t(o,l){let c=o.array,u=o.usage,f=c.byteLength,d=i.createBuffer();i.bindBuffer(l,d),i.bufferData(l,c,u),o.onUploadCallback();let p;if(c instanceof Float32Array)p=i.FLOAT;else if(c instanceof Uint16Array)o.isFloat16BufferAttribute?p=i.HALF_FLOAT:p=i.UNSIGNED_SHORT;else if(c instanceof Int16Array)p=i.SHORT;else if(c instanceof Uint32Array)p=i.UNSIGNED_INT;else if(c instanceof Int32Array)p=i.INT;else if(c instanceof Int8Array)p=i.BYTE;else if(c instanceof Uint8Array)p=i.UNSIGNED_BYTE;else if(c instanceof Uint8ClampedArray)p=i.UNSIGNED_BYTE;else throw new Error("THREE.WebGLAttributes: Unsupported buffer data format: "+c);return{buffer:d,type:p,bytesPerElement:c.BYTES_PER_ELEMENT,version:o.version,size:f}}function n(o,l,c){let u=l.array,f=l.updateRanges;if(i.bindBuffer(c,o),f.length===0)i.bufferSubData(c,0,u);else{f.sort((p,g)=>p.start-g.start);let d=0;for(let p=1;p<f.length;p++){let g=f[d],_=f[p];_.start<=g.start+g.count+1?g.count=Math.max(g.count,_.start+_.count-g.start):(++d,f[d]=_)}f.length=d+1;for(let p=0,g=f.length;p<g;p++){let _=f[p];i.bufferSubData(c,_.start*u.BYTES_PER_ELEMENT,u,_.start,_.count)}l.clearUpdateRanges()}l.onUploadCallback()}function r(o){return o.isInterleavedBufferAttribute&&(o=o.data),e.get(o)}function s(o){o.isInterleavedBufferAttribute&&(o=o.data);let l=e.get(o);l&&(i.deleteBuffer(l.buffer),e.delete(o))}function a(o,l){if(o.isInterleavedBufferAttribute&&(o=o.data),o.isGLBufferAttribute){let u=e.get(o);(!u||u.version<o.version)&&e.set(o,{buffer:o.buffer,type:o.type,bytesPerElement:o.elementSize,version:o.version});return}let c=e.get(o);if(c===void 0)e.set(o,t(o,l));else if(c.version<o.version){if(c.size!==o.array.byteLength)throw new Error("THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.");n(c.buffer,o,l),c.version=o.version}}return{get:r,remove:s,update:a}}var hr=class i extends cn{constructor(e=1,t=1,n=1,r=1){super(),this.type="PlaneGeometry",this.parameters={width:e,height:t,widthSegments:n,heightSegments:r};let s=e/2,a=t/2,o=Math.floor(n),l=Math.floor(r),c=o+1,u=l+1,f=e/o,d=t/l,p=[],g=[],_=[],m=[];for(let h=0;h<u;h++){let T=h*d-a;for(let w=0;w<c;w++){let M=w*f-s;g.push(M,-T,0),_.push(0,0,1),m.push(w/o),m.push(1-h/l)}}for(let h=0;h<l;h++)for(let T=0;T<o;T++){let w=T+c*h,M=T+c*(h+1),N=T+1+c*(h+1),A=T+1+c*h;p.push(w,M,A),p.push(M,N,A)}this.setIndex(p),this.setAttribute("position",new mt(g,3)),this.setAttribute("normal",new mt(_,3)),this.setAttribute("uv",new mt(m,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new i(e.width,e.height,e.widthSegments,e.heightSegments)}},dm=`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,pm=`#ifdef USE_ALPHAHASH
	const float ALPHA_HASH_SCALE = 0.05;
	float hash2D( vec2 value ) {
		return fract( 1.0e4 * sin( 17.0 * value.x + 0.1 * value.y ) * ( 0.1 + abs( sin( 13.0 * value.y + value.x ) ) ) );
	}
	float hash3D( vec3 value ) {
		return hash2D( vec2( hash2D( value.xy ), value.z ) );
	}
	float getAlphaHashThreshold( vec3 position ) {
		float maxDeriv = max(
			length( dFdx( position.xyz ) ),
			length( dFdy( position.xyz ) )
		);
		float pixScale = 1.0 / ( ALPHA_HASH_SCALE * maxDeriv );
		vec2 pixScales = vec2(
			exp2( floor( log2( pixScale ) ) ),
			exp2( ceil( log2( pixScale ) ) )
		);
		vec2 alpha = vec2(
			hash3D( floor( pixScales.x * position.xyz ) ),
			hash3D( floor( pixScales.y * position.xyz ) )
		);
		float lerpFactor = fract( log2( pixScale ) );
		float x = ( 1.0 - lerpFactor ) * alpha.x + lerpFactor * alpha.y;
		float a = min( lerpFactor, 1.0 - lerpFactor );
		vec3 cases = vec3(
			x * x / ( 2.0 * a * ( 1.0 - a ) ),
			( x - 0.5 * a ) / ( 1.0 - a ),
			1.0 - ( ( 1.0 - x ) * ( 1.0 - x ) / ( 2.0 * a * ( 1.0 - a ) ) )
		);
		float threshold = ( x < ( 1.0 - a ) )
			? ( ( x < a ) ? cases.x : cases.y )
			: cases.z;
		return clamp( threshold , 1.0e-6, 1.0 );
	}
#endif`,mm=`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,gm=`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,xm=`#ifdef USE_ALPHATEST
	#ifdef ALPHA_TO_COVERAGE
	diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );
	if ( diffuseColor.a == 0.0 ) discard;
	#else
	if ( diffuseColor.a < alphaTest ) discard;
	#endif
#endif`,_m=`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,ym=`#ifdef USE_AOMAP
	float ambientOcclusion = ( texture2D( aoMap, vAoMapUv ).r - 1.0 ) * aoMapIntensity + 1.0;
	reflectedLight.indirectDiffuse *= ambientOcclusion;
	#if defined( USE_CLEARCOAT ) 
		clearcoatSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_SHEEN ) 
		sheenSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD )
		float dotNV = saturate( dot( geometryNormal, geometryViewDir ) );
		reflectedLight.indirectSpecular *= computeSpecularOcclusion( dotNV, ambientOcclusion, material.roughness );
	#endif
#endif`,vm=`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,Sm=`#ifdef USE_BATCHING
	#if ! defined( GL_ANGLE_multi_draw )
	#define gl_DrawID _gl_DrawID
	uniform int _gl_DrawID;
	#endif
	uniform highp sampler2D batchingTexture;
	uniform highp usampler2D batchingIdTexture;
	mat4 getBatchingMatrix( const in float i ) {
		int size = textureSize( batchingTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( batchingTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( batchingTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( batchingTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( batchingTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
	float getIndirectIndex( const in int i ) {
		int size = textureSize( batchingIdTexture, 0 ).x;
		int x = i % size;
		int y = i / size;
		return float( texelFetch( batchingIdTexture, ivec2( x, y ), 0 ).r );
	}
#endif
#ifdef USE_BATCHING_COLOR
	uniform sampler2D batchingColorTexture;
	vec3 getBatchingColor( const in float i ) {
		int size = textureSize( batchingColorTexture, 0 ).x;
		int j = int( i );
		int x = j % size;
		int y = j / size;
		return texelFetch( batchingColorTexture, ivec2( x, y ), 0 ).rgb;
	}
#endif`,Mm=`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( getIndirectIndex( gl_DrawID ) );
#endif`,bm=`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,wm=`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,Em=`float G_BlinnPhong_Implicit( ) {
	return 0.25;
}
float D_BlinnPhong( const in float shininess, const in float dotNH ) {
	return RECIPROCAL_PI * ( shininess * 0.5 + 1.0 ) * pow( dotNH, shininess );
}
vec3 BRDF_BlinnPhong( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in vec3 specularColor, const in float shininess ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( specularColor, 1.0, dotVH );
	float G = G_BlinnPhong_Implicit( );
	float D = D_BlinnPhong( shininess, dotNH );
	return F * ( G * D );
} // validated`,Tm=`#ifdef USE_IRIDESCENCE
	const mat3 XYZ_TO_REC709 = mat3(
		 3.2404542, -0.9692660,  0.0556434,
		-1.5371385,  1.8760108, -0.2040259,
		-0.4985314,  0.0415560,  1.0572252
	);
	vec3 Fresnel0ToIor( vec3 fresnel0 ) {
		vec3 sqrtF0 = sqrt( fresnel0 );
		return ( vec3( 1.0 ) + sqrtF0 ) / ( vec3( 1.0 ) - sqrtF0 );
	}
	vec3 IorToFresnel0( vec3 transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - vec3( incidentIor ) ) / ( transmittedIor + vec3( incidentIor ) ) );
	}
	float IorToFresnel0( float transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - incidentIor ) / ( transmittedIor + incidentIor ));
	}
	vec3 evalSensitivity( float OPD, vec3 shift ) {
		float phase = 2.0 * PI * OPD * 1.0e-9;
		vec3 val = vec3( 5.4856e-13, 4.4201e-13, 5.2481e-13 );
		vec3 pos = vec3( 1.6810e+06, 1.7953e+06, 2.2084e+06 );
		vec3 var = vec3( 4.3278e+09, 9.3046e+09, 6.6121e+09 );
		vec3 xyz = val * sqrt( 2.0 * PI * var ) * cos( pos * phase + shift ) * exp( - pow2( phase ) * var );
		xyz.x += 9.7470e-14 * sqrt( 2.0 * PI * 4.5282e+09 ) * cos( 2.2399e+06 * phase + shift[ 0 ] ) * exp( - 4.5282e+09 * pow2( phase ) );
		xyz /= 1.0685e-7;
		vec3 rgb = XYZ_TO_REC709 * xyz;
		return rgb;
	}
	vec3 evalIridescence( float outsideIOR, float eta2, float cosTheta1, float thinFilmThickness, vec3 baseF0 ) {
		vec3 I;
		float iridescenceIOR = mix( outsideIOR, eta2, smoothstep( 0.0, 0.03, thinFilmThickness ) );
		float sinTheta2Sq = pow2( outsideIOR / iridescenceIOR ) * ( 1.0 - pow2( cosTheta1 ) );
		float cosTheta2Sq = 1.0 - sinTheta2Sq;
		if ( cosTheta2Sq < 0.0 ) {
			return vec3( 1.0 );
		}
		float cosTheta2 = sqrt( cosTheta2Sq );
		float R0 = IorToFresnel0( iridescenceIOR, outsideIOR );
		float R12 = F_Schlick( R0, 1.0, cosTheta1 );
		float T121 = 1.0 - R12;
		float phi12 = 0.0;
		if ( iridescenceIOR < outsideIOR ) phi12 = PI;
		float phi21 = PI - phi12;
		vec3 baseIOR = Fresnel0ToIor( clamp( baseF0, 0.0, 0.9999 ) );		vec3 R1 = IorToFresnel0( baseIOR, iridescenceIOR );
		vec3 R23 = F_Schlick( R1, 1.0, cosTheta2 );
		vec3 phi23 = vec3( 0.0 );
		if ( baseIOR[ 0 ] < iridescenceIOR ) phi23[ 0 ] = PI;
		if ( baseIOR[ 1 ] < iridescenceIOR ) phi23[ 1 ] = PI;
		if ( baseIOR[ 2 ] < iridescenceIOR ) phi23[ 2 ] = PI;
		float OPD = 2.0 * iridescenceIOR * thinFilmThickness * cosTheta2;
		vec3 phi = vec3( phi21 ) + phi23;
		vec3 R123 = clamp( R12 * R23, 1e-5, 0.9999 );
		vec3 r123 = sqrt( R123 );
		vec3 Rs = pow2( T121 ) * R23 / ( vec3( 1.0 ) - R123 );
		vec3 C0 = R12 + Rs;
		I = C0;
		vec3 Cm = Rs - T121;
		for ( int m = 1; m <= 2; ++ m ) {
			Cm *= r123;
			vec3 Sm = 2.0 * evalSensitivity( float( m ) * OPD, float( m ) * phi );
			I += Cm * Sm;
		}
		return max( I, vec3( 0.0 ) );
	}
#endif`,Am=`#ifdef USE_BUMPMAP
	uniform sampler2D bumpMap;
	uniform float bumpScale;
	vec2 dHdxy_fwd() {
		vec2 dSTdx = dFdx( vBumpMapUv );
		vec2 dSTdy = dFdy( vBumpMapUv );
		float Hll = bumpScale * texture2D( bumpMap, vBumpMapUv ).x;
		float dBx = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdx ).x - Hll;
		float dBy = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdy ).x - Hll;
		return vec2( dBx, dBy );
	}
	vec3 perturbNormalArb( vec3 surf_pos, vec3 surf_norm, vec2 dHdxy, float faceDirection ) {
		vec3 vSigmaX = normalize( dFdx( surf_pos.xyz ) );
		vec3 vSigmaY = normalize( dFdy( surf_pos.xyz ) );
		vec3 vN = surf_norm;
		vec3 R1 = cross( vSigmaY, vN );
		vec3 R2 = cross( vN, vSigmaX );
		float fDet = dot( vSigmaX, R1 ) * faceDirection;
		vec3 vGrad = sign( fDet ) * ( dHdxy.x * R1 + dHdxy.y * R2 );
		return normalize( abs( fDet ) * surf_norm - vGrad );
	}
#endif`,Cm=`#if NUM_CLIPPING_PLANES > 0
	vec4 plane;
	#ifdef ALPHA_TO_COVERAGE
		float distanceToPlane, distanceGradient;
		float clipOpacity = 1.0;
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
			distanceGradient = fwidth( distanceToPlane ) / 2.0;
			clipOpacity *= smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			if ( clipOpacity == 0.0 ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			float unionClipOpacity = 1.0;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
				distanceGradient = fwidth( distanceToPlane ) / 2.0;
				unionClipOpacity *= 1.0 - smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			}
			#pragma unroll_loop_end
			clipOpacity *= 1.0 - unionClipOpacity;
		#endif
		diffuseColor.a *= clipOpacity;
		if ( diffuseColor.a == 0.0 ) discard;
	#else
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			if ( dot( vClipPosition, plane.xyz ) > plane.w ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			bool clipped = true;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				clipped = ( dot( vClipPosition, plane.xyz ) > plane.w ) && clipped;
			}
			#pragma unroll_loop_end
			if ( clipped ) discard;
		#endif
	#endif
#endif`,Rm=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,Pm=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,Im=`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,Lm=`#if defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#elif defined( USE_COLOR )
	diffuseColor.rgb *= vColor;
#endif`,Dm=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR )
	varying vec3 vColor;
#endif`,Um=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	varying vec3 vColor;
#endif`,Nm=`#if defined( USE_COLOR_ALPHA )
	vColor = vec4( 1.0 );
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	vColor = vec3( 1.0 );
#endif
#ifdef USE_COLOR
	vColor *= color;
#endif
#ifdef USE_INSTANCING_COLOR
	vColor.xyz *= instanceColor.xyz;
#endif
#ifdef USE_BATCHING_COLOR
	vec3 batchingColor = getBatchingColor( getIndirectIndex( gl_DrawID ) );
	vColor.xyz *= batchingColor.xyz;
#endif`,Om=`#define PI 3.141592653589793
#define PI2 6.283185307179586
#define PI_HALF 1.5707963267948966
#define RECIPROCAL_PI 0.3183098861837907
#define RECIPROCAL_PI2 0.15915494309189535
#define EPSILON 1e-6
#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
#define whiteComplement( a ) ( 1.0 - saturate( a ) )
float pow2( const in float x ) { return x*x; }
vec3 pow2( const in vec3 x ) { return x*x; }
float pow3( const in float x ) { return x*x*x; }
float pow4( const in float x ) { float x2 = x*x; return x2*x2; }
float max3( const in vec3 v ) { return max( max( v.x, v.y ), v.z ); }
float average( const in vec3 v ) { return dot( v, vec3( 0.3333333 ) ); }
highp float rand( const in vec2 uv ) {
	const highp float a = 12.9898, b = 78.233, c = 43758.5453;
	highp float dt = dot( uv.xy, vec2( a,b ) ), sn = mod( dt, PI );
	return fract( sin( sn ) * c );
}
#ifdef HIGH_PRECISION
	float precisionSafeLength( vec3 v ) { return length( v ); }
#else
	float precisionSafeLength( vec3 v ) {
		float maxComponent = max3( abs( v ) );
		return length( v / maxComponent ) * maxComponent;
	}
#endif
struct IncidentLight {
	vec3 color;
	vec3 direction;
	bool visible;
};
struct ReflectedLight {
	vec3 directDiffuse;
	vec3 directSpecular;
	vec3 indirectDiffuse;
	vec3 indirectSpecular;
};
#ifdef USE_ALPHAHASH
	varying vec3 vPosition;
#endif
vec3 transformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );
}
vec3 inverseTransformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( vec4( dir, 0.0 ) * matrix ).xyz );
}
mat3 transposeMat3( const in mat3 m ) {
	mat3 tmp;
	tmp[ 0 ] = vec3( m[ 0 ].x, m[ 1 ].x, m[ 2 ].x );
	tmp[ 1 ] = vec3( m[ 0 ].y, m[ 1 ].y, m[ 2 ].y );
	tmp[ 2 ] = vec3( m[ 0 ].z, m[ 1 ].z, m[ 2 ].z );
	return tmp;
}
bool isPerspectiveMatrix( mat4 m ) {
	return m[ 2 ][ 3 ] == - 1.0;
}
vec2 equirectUv( in vec3 dir ) {
	float u = atan( dir.z, dir.x ) * RECIPROCAL_PI2 + 0.5;
	float v = asin( clamp( dir.y, - 1.0, 1.0 ) ) * RECIPROCAL_PI + 0.5;
	return vec2( u, v );
}
vec3 BRDF_Lambert( const in vec3 diffuseColor ) {
	return RECIPROCAL_PI * diffuseColor;
}
vec3 F_Schlick( const in vec3 f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
}
float F_Schlick( const in float f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
} // validated`,Fm=`#ifdef ENVMAP_TYPE_CUBE_UV
	#define cubeUV_minMipLevel 4.0
	#define cubeUV_minTileSize 16.0
	float getFace( vec3 direction ) {
		vec3 absDirection = abs( direction );
		float face = - 1.0;
		if ( absDirection.x > absDirection.z ) {
			if ( absDirection.x > absDirection.y )
				face = direction.x > 0.0 ? 0.0 : 3.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		} else {
			if ( absDirection.z > absDirection.y )
				face = direction.z > 0.0 ? 2.0 : 5.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		}
		return face;
	}
	vec2 getUV( vec3 direction, float face ) {
		vec2 uv;
		if ( face == 0.0 ) {
			uv = vec2( direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 1.0 ) {
			uv = vec2( - direction.x, - direction.z ) / abs( direction.y );
		} else if ( face == 2.0 ) {
			uv = vec2( - direction.x, direction.y ) / abs( direction.z );
		} else if ( face == 3.0 ) {
			uv = vec2( - direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 4.0 ) {
			uv = vec2( - direction.x, direction.z ) / abs( direction.y );
		} else {
			uv = vec2( direction.x, direction.y ) / abs( direction.z );
		}
		return 0.5 * ( uv + 1.0 );
	}
	vec3 bilinearCubeUV( sampler2D envMap, vec3 direction, float mipInt ) {
		float face = getFace( direction );
		float filterInt = max( cubeUV_minMipLevel - mipInt, 0.0 );
		mipInt = max( mipInt, cubeUV_minMipLevel );
		float faceSize = exp2( mipInt );
		highp vec2 uv = getUV( direction, face ) * ( faceSize - 2.0 ) + 1.0;
		if ( face > 2.0 ) {
			uv.y += faceSize;
			face -= 3.0;
		}
		uv.x += face * faceSize;
		uv.x += filterInt * 3.0 * cubeUV_minTileSize;
		uv.y += 4.0 * ( exp2( CUBEUV_MAX_MIP ) - faceSize );
		uv.x *= CUBEUV_TEXEL_WIDTH;
		uv.y *= CUBEUV_TEXEL_HEIGHT;
		#ifdef texture2DGradEXT
			return texture2DGradEXT( envMap, uv, vec2( 0.0 ), vec2( 0.0 ) ).rgb;
		#else
			return texture2D( envMap, uv ).rgb;
		#endif
	}
	#define cubeUV_r0 1.0
	#define cubeUV_m0 - 2.0
	#define cubeUV_r1 0.8
	#define cubeUV_m1 - 1.0
	#define cubeUV_r4 0.4
	#define cubeUV_m4 2.0
	#define cubeUV_r5 0.305
	#define cubeUV_m5 3.0
	#define cubeUV_r6 0.21
	#define cubeUV_m6 4.0
	float roughnessToMip( float roughness ) {
		float mip = 0.0;
		if ( roughness >= cubeUV_r1 ) {
			mip = ( cubeUV_r0 - roughness ) * ( cubeUV_m1 - cubeUV_m0 ) / ( cubeUV_r0 - cubeUV_r1 ) + cubeUV_m0;
		} else if ( roughness >= cubeUV_r4 ) {
			mip = ( cubeUV_r1 - roughness ) * ( cubeUV_m4 - cubeUV_m1 ) / ( cubeUV_r1 - cubeUV_r4 ) + cubeUV_m1;
		} else if ( roughness >= cubeUV_r5 ) {
			mip = ( cubeUV_r4 - roughness ) * ( cubeUV_m5 - cubeUV_m4 ) / ( cubeUV_r4 - cubeUV_r5 ) + cubeUV_m4;
		} else if ( roughness >= cubeUV_r6 ) {
			mip = ( cubeUV_r5 - roughness ) * ( cubeUV_m6 - cubeUV_m5 ) / ( cubeUV_r5 - cubeUV_r6 ) + cubeUV_m5;
		} else {
			mip = - 2.0 * log2( 1.16 * roughness );		}
		return mip;
	}
	vec4 textureCubeUV( sampler2D envMap, vec3 sampleDir, float roughness ) {
		float mip = clamp( roughnessToMip( roughness ), cubeUV_m0, CUBEUV_MAX_MIP );
		float mipF = fract( mip );
		float mipInt = floor( mip );
		vec3 color0 = bilinearCubeUV( envMap, sampleDir, mipInt );
		if ( mipF == 0.0 ) {
			return vec4( color0, 1.0 );
		} else {
			vec3 color1 = bilinearCubeUV( envMap, sampleDir, mipInt + 1.0 );
			return vec4( mix( color0, color1, mipF ), 1.0 );
		}
	}
#endif`,Bm=`vec3 transformedNormal = objectNormal;
#ifdef USE_TANGENT
	vec3 transformedTangent = objectTangent;
#endif
#ifdef USE_BATCHING
	mat3 bm = mat3( batchingMatrix );
	transformedNormal /= vec3( dot( bm[ 0 ], bm[ 0 ] ), dot( bm[ 1 ], bm[ 1 ] ), dot( bm[ 2 ], bm[ 2 ] ) );
	transformedNormal = bm * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = bm * transformedTangent;
	#endif
#endif
#ifdef USE_INSTANCING
	mat3 im = mat3( instanceMatrix );
	transformedNormal /= vec3( dot( im[ 0 ], im[ 0 ] ), dot( im[ 1 ], im[ 1 ] ), dot( im[ 2 ], im[ 2 ] ) );
	transformedNormal = im * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = im * transformedTangent;
	#endif
#endif
transformedNormal = normalMatrix * transformedNormal;
#ifdef FLIP_SIDED
	transformedNormal = - transformedNormal;
#endif
#ifdef USE_TANGENT
	transformedTangent = ( modelViewMatrix * vec4( transformedTangent, 0.0 ) ).xyz;
	#ifdef FLIP_SIDED
		transformedTangent = - transformedTangent;
	#endif
#endif`,km=`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,zm=`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,Hm=`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	#ifdef DECODE_VIDEO_TEXTURE_EMISSIVE
		emissiveColor = sRGBTransferEOTF( emissiveColor );
	#endif
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,Vm=`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,Gm="gl_FragColor = linearToOutputTexel( gl_FragColor );",Wm=`vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferEOTF( in vec4 value ) {
	return vec4( mix( pow( value.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), value.rgb * 0.0773993808, vec3( lessThanEqual( value.rgb, vec3( 0.04045 ) ) ) ), value.a );
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}`,Xm=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vec3 cameraToFrag;
		if ( isOrthographic ) {
			cameraToFrag = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToFrag = normalize( vWorldPosition - cameraPosition );
		}
		vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vec3 reflectVec = reflect( cameraToFrag, worldNormal );
		#else
			vec3 reflectVec = refract( cameraToFrag, worldNormal, refractionRatio );
		#endif
	#else
		vec3 reflectVec = vReflect;
	#endif
	#ifdef ENVMAP_TYPE_CUBE
		vec4 envColor = textureCube( envMap, envMapRotation * vec3( flipEnvMap * reflectVec.x, reflectVec.yz ) );
	#else
		vec4 envColor = vec4( 0.0 );
	#endif
	#ifdef ENVMAP_BLENDING_MULTIPLY
		outgoingLight = mix( outgoingLight, outgoingLight * envColor.xyz, specularStrength * reflectivity );
	#elif defined( ENVMAP_BLENDING_MIX )
		outgoingLight = mix( outgoingLight, envColor.xyz, specularStrength * reflectivity );
	#elif defined( ENVMAP_BLENDING_ADD )
		outgoingLight += envColor.xyz * specularStrength * reflectivity;
	#endif
#endif`,qm=`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform float flipEnvMap;
	uniform mat3 envMapRotation;
	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif
	
#endif`,Ym=`#ifdef USE_ENVMAP
	uniform float reflectivity;
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		varying vec3 vWorldPosition;
		uniform float refractionRatio;
	#else
		varying vec3 vReflect;
	#endif
#endif`,$m=`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,Zm=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vWorldPosition = worldPosition.xyz;
	#else
		vec3 cameraToVertex;
		if ( isOrthographic ) {
			cameraToVertex = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToVertex = normalize( worldPosition.xyz - cameraPosition );
		}
		vec3 worldNormal = inverseTransformDirection( transformedNormal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vReflect = reflect( cameraToVertex, worldNormal );
		#else
			vReflect = refract( cameraToVertex, worldNormal, refractionRatio );
		#endif
	#endif
#endif`,Km=`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,Jm=`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,jm=`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,Qm=`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,eg=`#ifdef USE_GRADIENTMAP
	uniform sampler2D gradientMap;
#endif
vec3 getGradientIrradiance( vec3 normal, vec3 lightDirection ) {
	float dotNL = dot( normal, lightDirection );
	vec2 coord = vec2( dotNL * 0.5 + 0.5, 0.0 );
	#ifdef USE_GRADIENTMAP
		return vec3( texture2D( gradientMap, coord ).r );
	#else
		vec2 fw = fwidth( coord ) * 0.5;
		return mix( vec3( 0.7 ), vec3( 1.0 ), smoothstep( 0.7 - fw.x, 0.7 + fw.x, coord.x ) );
	#endif
}`,tg=`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,ng=`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,ig=`varying vec3 vViewPosition;
struct LambertMaterial {
	vec3 diffuseColor;
	float specularStrength;
};
void RE_Direct_Lambert( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Lambert( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Lambert
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,rg=`uniform bool receiveShadow;
uniform vec3 ambientLightColor;
#if defined( USE_LIGHT_PROBES )
	uniform vec3 lightProbe[ 9 ];
#endif
vec3 shGetIrradianceAt( in vec3 normal, in vec3 shCoefficients[ 9 ] ) {
	float x = normal.x, y = normal.y, z = normal.z;
	vec3 result = shCoefficients[ 0 ] * 0.886227;
	result += shCoefficients[ 1 ] * 2.0 * 0.511664 * y;
	result += shCoefficients[ 2 ] * 2.0 * 0.511664 * z;
	result += shCoefficients[ 3 ] * 2.0 * 0.511664 * x;
	result += shCoefficients[ 4 ] * 2.0 * 0.429043 * x * y;
	result += shCoefficients[ 5 ] * 2.0 * 0.429043 * y * z;
	result += shCoefficients[ 6 ] * ( 0.743125 * z * z - 0.247708 );
	result += shCoefficients[ 7 ] * 2.0 * 0.429043 * x * z;
	result += shCoefficients[ 8 ] * 0.429043 * ( x * x - y * y );
	return result;
}
vec3 getLightProbeIrradiance( const in vec3 lightProbe[ 9 ], const in vec3 normal ) {
	vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
	vec3 irradiance = shGetIrradianceAt( worldNormal, lightProbe );
	return irradiance;
}
vec3 getAmbientLightIrradiance( const in vec3 ambientLightColor ) {
	vec3 irradiance = ambientLightColor;
	return irradiance;
}
float getDistanceAttenuation( const in float lightDistance, const in float cutoffDistance, const in float decayExponent ) {
	float distanceFalloff = 1.0 / max( pow( lightDistance, decayExponent ), 0.01 );
	if ( cutoffDistance > 0.0 ) {
		distanceFalloff *= pow2( saturate( 1.0 - pow4( lightDistance / cutoffDistance ) ) );
	}
	return distanceFalloff;
}
float getSpotAttenuation( const in float coneCosine, const in float penumbraCosine, const in float angleCosine ) {
	return smoothstep( coneCosine, penumbraCosine, angleCosine );
}
#if NUM_DIR_LIGHTS > 0
	struct DirectionalLight {
		vec3 direction;
		vec3 color;
	};
	uniform DirectionalLight directionalLights[ NUM_DIR_LIGHTS ];
	void getDirectionalLightInfo( const in DirectionalLight directionalLight, out IncidentLight light ) {
		light.color = directionalLight.color;
		light.direction = directionalLight.direction;
		light.visible = true;
	}
#endif
#if NUM_POINT_LIGHTS > 0
	struct PointLight {
		vec3 position;
		vec3 color;
		float distance;
		float decay;
	};
	uniform PointLight pointLights[ NUM_POINT_LIGHTS ];
	void getPointLightInfo( const in PointLight pointLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = pointLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float lightDistance = length( lVector );
		light.color = pointLight.color;
		light.color *= getDistanceAttenuation( lightDistance, pointLight.distance, pointLight.decay );
		light.visible = ( light.color != vec3( 0.0 ) );
	}
#endif
#if NUM_SPOT_LIGHTS > 0
	struct SpotLight {
		vec3 position;
		vec3 direction;
		vec3 color;
		float distance;
		float decay;
		float coneCos;
		float penumbraCos;
	};
	uniform SpotLight spotLights[ NUM_SPOT_LIGHTS ];
	void getSpotLightInfo( const in SpotLight spotLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = spotLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float angleCos = dot( light.direction, spotLight.direction );
		float spotAttenuation = getSpotAttenuation( spotLight.coneCos, spotLight.penumbraCos, angleCos );
		if ( spotAttenuation > 0.0 ) {
			float lightDistance = length( lVector );
			light.color = spotLight.color * spotAttenuation;
			light.color *= getDistanceAttenuation( lightDistance, spotLight.distance, spotLight.decay );
			light.visible = ( light.color != vec3( 0.0 ) );
		} else {
			light.color = vec3( 0.0 );
			light.visible = false;
		}
	}
#endif
#if NUM_RECT_AREA_LIGHTS > 0
	struct RectAreaLight {
		vec3 color;
		vec3 position;
		vec3 halfWidth;
		vec3 halfHeight;
	};
	uniform sampler2D ltc_1;	uniform sampler2D ltc_2;
	uniform RectAreaLight rectAreaLights[ NUM_RECT_AREA_LIGHTS ];
#endif
#if NUM_HEMI_LIGHTS > 0
	struct HemisphereLight {
		vec3 direction;
		vec3 skyColor;
		vec3 groundColor;
	};
	uniform HemisphereLight hemisphereLights[ NUM_HEMI_LIGHTS ];
	vec3 getHemisphereLightIrradiance( const in HemisphereLight hemiLight, const in vec3 normal ) {
		float dotNL = dot( normal, hemiLight.direction );
		float hemiDiffuseWeight = 0.5 * dotNL + 0.5;
		vec3 irradiance = mix( hemiLight.groundColor, hemiLight.skyColor, hemiDiffuseWeight );
		return irradiance;
	}
#endif`,sg=`#ifdef USE_ENVMAP
	vec3 getIBLIrradiance( const in vec3 normal ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * worldNormal, 1.0 );
			return PI * envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	vec3 getIBLRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 reflectVec = reflect( - viewDir, normal );
			reflectVec = normalize( mix( reflectVec, normal, roughness * roughness) );
			reflectVec = inverseTransformDirection( reflectVec, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * reflectVec, roughness );
			return envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	#ifdef USE_ANISOTROPY
		vec3 getIBLAnisotropyRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
			#ifdef ENVMAP_TYPE_CUBE_UV
				vec3 bentNormal = cross( bitangent, viewDir );
				bentNormal = normalize( cross( bentNormal, bitangent ) );
				bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
				return getIBLRadiance( viewDir, bentNormal, roughness );
			#else
				return vec3( 0.0 );
			#endif
		}
	#endif
#endif`,ag=`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,og=`varying vec3 vViewPosition;
struct ToonMaterial {
	vec3 diffuseColor;
};
void RE_Direct_Toon( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 irradiance = getGradientIrradiance( geometryNormal, directLight.direction ) * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Toon( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Toon
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,lg=`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,cg=`varying vec3 vViewPosition;
struct BlinnPhongMaterial {
	vec3 diffuseColor;
	vec3 specularColor;
	float specularShininess;
	float specularStrength;
};
void RE_Direct_BlinnPhong( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
	reflectedLight.directSpecular += irradiance * BRDF_BlinnPhong( directLight.direction, geometryViewDir, geometryNormal, material.specularColor, material.specularShininess ) * material.specularStrength;
}
void RE_IndirectDiffuse_BlinnPhong( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_BlinnPhong
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,ug=`PhysicalMaterial material;
material.diffuseColor = diffuseColor.rgb * ( 1.0 - metalnessFactor );
vec3 dxy = max( abs( dFdx( nonPerturbedNormal ) ), abs( dFdy( nonPerturbedNormal ) ) );
float geometryRoughness = max( max( dxy.x, dxy.y ), dxy.z );
material.roughness = max( roughnessFactor, 0.0525 );material.roughness += geometryRoughness;
material.roughness = min( material.roughness, 1.0 );
#ifdef IOR
	material.ior = ior;
	#ifdef USE_SPECULAR
		float specularIntensityFactor = specularIntensity;
		vec3 specularColorFactor = specularColor;
		#ifdef USE_SPECULAR_COLORMAP
			specularColorFactor *= texture2D( specularColorMap, vSpecularColorMapUv ).rgb;
		#endif
		#ifdef USE_SPECULAR_INTENSITYMAP
			specularIntensityFactor *= texture2D( specularIntensityMap, vSpecularIntensityMapUv ).a;
		#endif
		material.specularF90 = mix( specularIntensityFactor, 1.0, metalnessFactor );
	#else
		float specularIntensityFactor = 1.0;
		vec3 specularColorFactor = vec3( 1.0 );
		material.specularF90 = 1.0;
	#endif
	material.specularColor = mix( min( pow2( ( material.ior - 1.0 ) / ( material.ior + 1.0 ) ) * specularColorFactor, vec3( 1.0 ) ) * specularIntensityFactor, diffuseColor.rgb, metalnessFactor );
#else
	material.specularColor = mix( vec3( 0.04 ), diffuseColor.rgb, metalnessFactor );
	material.specularF90 = 1.0;
#endif
#ifdef USE_CLEARCOAT
	material.clearcoat = clearcoat;
	material.clearcoatRoughness = clearcoatRoughness;
	material.clearcoatF0 = vec3( 0.04 );
	material.clearcoatF90 = 1.0;
	#ifdef USE_CLEARCOATMAP
		material.clearcoat *= texture2D( clearcoatMap, vClearcoatMapUv ).x;
	#endif
	#ifdef USE_CLEARCOAT_ROUGHNESSMAP
		material.clearcoatRoughness *= texture2D( clearcoatRoughnessMap, vClearcoatRoughnessMapUv ).y;
	#endif
	material.clearcoat = saturate( material.clearcoat );	material.clearcoatRoughness = max( material.clearcoatRoughness, 0.0525 );
	material.clearcoatRoughness += geometryRoughness;
	material.clearcoatRoughness = min( material.clearcoatRoughness, 1.0 );
#endif
#ifdef USE_DISPERSION
	material.dispersion = dispersion;
#endif
#ifdef USE_IRIDESCENCE
	material.iridescence = iridescence;
	material.iridescenceIOR = iridescenceIOR;
	#ifdef USE_IRIDESCENCEMAP
		material.iridescence *= texture2D( iridescenceMap, vIridescenceMapUv ).r;
	#endif
	#ifdef USE_IRIDESCENCE_THICKNESSMAP
		material.iridescenceThickness = (iridescenceThicknessMaximum - iridescenceThicknessMinimum) * texture2D( iridescenceThicknessMap, vIridescenceThicknessMapUv ).g + iridescenceThicknessMinimum;
	#else
		material.iridescenceThickness = iridescenceThicknessMaximum;
	#endif
#endif
#ifdef USE_SHEEN
	material.sheenColor = sheenColor;
	#ifdef USE_SHEEN_COLORMAP
		material.sheenColor *= texture2D( sheenColorMap, vSheenColorMapUv ).rgb;
	#endif
	material.sheenRoughness = clamp( sheenRoughness, 0.07, 1.0 );
	#ifdef USE_SHEEN_ROUGHNESSMAP
		material.sheenRoughness *= texture2D( sheenRoughnessMap, vSheenRoughnessMapUv ).a;
	#endif
#endif
#ifdef USE_ANISOTROPY
	#ifdef USE_ANISOTROPYMAP
		mat2 anisotropyMat = mat2( anisotropyVector.x, anisotropyVector.y, - anisotropyVector.y, anisotropyVector.x );
		vec3 anisotropyPolar = texture2D( anisotropyMap, vAnisotropyMapUv ).rgb;
		vec2 anisotropyV = anisotropyMat * normalize( 2.0 * anisotropyPolar.rg - vec2( 1.0 ) ) * anisotropyPolar.b;
	#else
		vec2 anisotropyV = anisotropyVector;
	#endif
	material.anisotropy = length( anisotropyV );
	if( material.anisotropy == 0.0 ) {
		anisotropyV = vec2( 1.0, 0.0 );
	} else {
		anisotropyV /= material.anisotropy;
		material.anisotropy = saturate( material.anisotropy );
	}
	material.alphaT = mix( pow2( material.roughness ), 1.0, pow2( material.anisotropy ) );
	material.anisotropyT = tbn[ 0 ] * anisotropyV.x + tbn[ 1 ] * anisotropyV.y;
	material.anisotropyB = tbn[ 1 ] * anisotropyV.x - tbn[ 0 ] * anisotropyV.y;
#endif`,fg=`struct PhysicalMaterial {
	vec3 diffuseColor;
	float roughness;
	vec3 specularColor;
	float specularF90;
	float dispersion;
	#ifdef USE_CLEARCOAT
		float clearcoat;
		float clearcoatRoughness;
		vec3 clearcoatF0;
		float clearcoatF90;
	#endif
	#ifdef USE_IRIDESCENCE
		float iridescence;
		float iridescenceIOR;
		float iridescenceThickness;
		vec3 iridescenceFresnel;
		vec3 iridescenceF0;
	#endif
	#ifdef USE_SHEEN
		vec3 sheenColor;
		float sheenRoughness;
	#endif
	#ifdef IOR
		float ior;
	#endif
	#ifdef USE_TRANSMISSION
		float transmission;
		float transmissionAlpha;
		float thickness;
		float attenuationDistance;
		vec3 attenuationColor;
	#endif
	#ifdef USE_ANISOTROPY
		float anisotropy;
		float alphaT;
		vec3 anisotropyT;
		vec3 anisotropyB;
	#endif
};
vec3 clearcoatSpecularDirect = vec3( 0.0 );
vec3 clearcoatSpecularIndirect = vec3( 0.0 );
vec3 sheenSpecularDirect = vec3( 0.0 );
vec3 sheenSpecularIndirect = vec3(0.0 );
vec3 Schlick_to_F0( const in vec3 f, const in float f90, const in float dotVH ) {
    float x = clamp( 1.0 - dotVH, 0.0, 1.0 );
    float x2 = x * x;
    float x5 = clamp( x * x2 * x2, 0.0, 0.9999 );
    return ( f - vec3( f90 ) * x5 ) / ( 1.0 - x5 );
}
float V_GGX_SmithCorrelated( const in float alpha, const in float dotNL, const in float dotNV ) {
	float a2 = pow2( alpha );
	float gv = dotNL * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNV ) );
	float gl = dotNV * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNL ) );
	return 0.5 / max( gv + gl, EPSILON );
}
float D_GGX( const in float alpha, const in float dotNH ) {
	float a2 = pow2( alpha );
	float denom = pow2( dotNH ) * ( a2 - 1.0 ) + 1.0;
	return RECIPROCAL_PI * a2 / pow2( denom );
}
#ifdef USE_ANISOTROPY
	float V_GGX_SmithCorrelated_Anisotropic( const in float alphaT, const in float alphaB, const in float dotTV, const in float dotBV, const in float dotTL, const in float dotBL, const in float dotNV, const in float dotNL ) {
		float gv = dotNL * length( vec3( alphaT * dotTV, alphaB * dotBV, dotNV ) );
		float gl = dotNV * length( vec3( alphaT * dotTL, alphaB * dotBL, dotNL ) );
		float v = 0.5 / ( gv + gl );
		return saturate(v);
	}
	float D_GGX_Anisotropic( const in float alphaT, const in float alphaB, const in float dotNH, const in float dotTH, const in float dotBH ) {
		float a2 = alphaT * alphaB;
		highp vec3 v = vec3( alphaB * dotTH, alphaT * dotBH, a2 * dotNH );
		highp float v2 = dot( v, v );
		float w2 = a2 / v2;
		return RECIPROCAL_PI * a2 * pow2 ( w2 );
	}
#endif
#ifdef USE_CLEARCOAT
	vec3 BRDF_GGX_Clearcoat( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material) {
		vec3 f0 = material.clearcoatF0;
		float f90 = material.clearcoatF90;
		float roughness = material.clearcoatRoughness;
		float alpha = pow2( roughness );
		vec3 halfDir = normalize( lightDir + viewDir );
		float dotNL = saturate( dot( normal, lightDir ) );
		float dotNV = saturate( dot( normal, viewDir ) );
		float dotNH = saturate( dot( normal, halfDir ) );
		float dotVH = saturate( dot( viewDir, halfDir ) );
		vec3 F = F_Schlick( f0, f90, dotVH );
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
		return F * ( V * D );
	}
#endif
vec3 BRDF_GGX( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material ) {
	vec3 f0 = material.specularColor;
	float f90 = material.specularF90;
	float roughness = material.roughness;
	float alpha = pow2( roughness );
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( f0, f90, dotVH );
	#ifdef USE_IRIDESCENCE
		F = mix( F, material.iridescenceFresnel, material.iridescence );
	#endif
	#ifdef USE_ANISOTROPY
		float dotTL = dot( material.anisotropyT, lightDir );
		float dotTV = dot( material.anisotropyT, viewDir );
		float dotTH = dot( material.anisotropyT, halfDir );
		float dotBL = dot( material.anisotropyB, lightDir );
		float dotBV = dot( material.anisotropyB, viewDir );
		float dotBH = dot( material.anisotropyB, halfDir );
		float V = V_GGX_SmithCorrelated_Anisotropic( material.alphaT, alpha, dotTV, dotBV, dotTL, dotBL, dotNV, dotNL );
		float D = D_GGX_Anisotropic( material.alphaT, alpha, dotNH, dotTH, dotBH );
	#else
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
	#endif
	return F * ( V * D );
}
vec2 LTC_Uv( const in vec3 N, const in vec3 V, const in float roughness ) {
	const float LUT_SIZE = 64.0;
	const float LUT_SCALE = ( LUT_SIZE - 1.0 ) / LUT_SIZE;
	const float LUT_BIAS = 0.5 / LUT_SIZE;
	float dotNV = saturate( dot( N, V ) );
	vec2 uv = vec2( roughness, sqrt( 1.0 - dotNV ) );
	uv = uv * LUT_SCALE + LUT_BIAS;
	return uv;
}
float LTC_ClippedSphereFormFactor( const in vec3 f ) {
	float l = length( f );
	return max( ( l * l + f.z ) / ( l + 1.0 ), 0.0 );
}
vec3 LTC_EdgeVectorFormFactor( const in vec3 v1, const in vec3 v2 ) {
	float x = dot( v1, v2 );
	float y = abs( x );
	float a = 0.8543985 + ( 0.4965155 + 0.0145206 * y ) * y;
	float b = 3.4175940 + ( 4.1616724 + y ) * y;
	float v = a / b;
	float theta_sintheta = ( x > 0.0 ) ? v : 0.5 * inversesqrt( max( 1.0 - x * x, 1e-7 ) ) - v;
	return cross( v1, v2 ) * theta_sintheta;
}
vec3 LTC_Evaluate( const in vec3 N, const in vec3 V, const in vec3 P, const in mat3 mInv, const in vec3 rectCoords[ 4 ] ) {
	vec3 v1 = rectCoords[ 1 ] - rectCoords[ 0 ];
	vec3 v2 = rectCoords[ 3 ] - rectCoords[ 0 ];
	vec3 lightNormal = cross( v1, v2 );
	if( dot( lightNormal, P - rectCoords[ 0 ] ) < 0.0 ) return vec3( 0.0 );
	vec3 T1, T2;
	T1 = normalize( V - N * dot( V, N ) );
	T2 = - cross( N, T1 );
	mat3 mat = mInv * transposeMat3( mat3( T1, T2, N ) );
	vec3 coords[ 4 ];
	coords[ 0 ] = mat * ( rectCoords[ 0 ] - P );
	coords[ 1 ] = mat * ( rectCoords[ 1 ] - P );
	coords[ 2 ] = mat * ( rectCoords[ 2 ] - P );
	coords[ 3 ] = mat * ( rectCoords[ 3 ] - P );
	coords[ 0 ] = normalize( coords[ 0 ] );
	coords[ 1 ] = normalize( coords[ 1 ] );
	coords[ 2 ] = normalize( coords[ 2 ] );
	coords[ 3 ] = normalize( coords[ 3 ] );
	vec3 vectorFormFactor = vec3( 0.0 );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 0 ], coords[ 1 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 1 ], coords[ 2 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 2 ], coords[ 3 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 3 ], coords[ 0 ] );
	float result = LTC_ClippedSphereFormFactor( vectorFormFactor );
	return vec3( result );
}
#if defined( USE_SHEEN )
float D_Charlie( float roughness, float dotNH ) {
	float alpha = pow2( roughness );
	float invAlpha = 1.0 / alpha;
	float cos2h = dotNH * dotNH;
	float sin2h = max( 1.0 - cos2h, 0.0078125 );
	return ( 2.0 + invAlpha ) * pow( sin2h, invAlpha * 0.5 ) / ( 2.0 * PI );
}
float V_Neubelt( float dotNV, float dotNL ) {
	return saturate( 1.0 / ( 4.0 * ( dotNL + dotNV - dotNL * dotNV ) ) );
}
vec3 BRDF_Sheen( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, vec3 sheenColor, const in float sheenRoughness ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float D = D_Charlie( sheenRoughness, dotNH );
	float V = V_Neubelt( dotNV, dotNL );
	return sheenColor * ( D * V );
}
#endif
float IBLSheenBRDF( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	float r2 = roughness * roughness;
	float a = roughness < 0.25 ? -339.2 * r2 + 161.4 * roughness - 25.9 : -8.48 * r2 + 14.3 * roughness - 9.95;
	float b = roughness < 0.25 ? 44.0 * r2 - 23.7 * roughness + 3.26 : 1.97 * r2 - 3.27 * roughness + 0.72;
	float DG = exp( a * dotNV + b ) + ( roughness < 0.25 ? 0.0 : 0.1 * ( roughness - 0.25 ) );
	return saturate( DG * RECIPROCAL_PI );
}
vec2 DFGApprox( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	const vec4 c0 = vec4( - 1, - 0.0275, - 0.572, 0.022 );
	const vec4 c1 = vec4( 1, 0.0425, 1.04, - 0.04 );
	vec4 r = roughness * c0 + c1;
	float a004 = min( r.x * r.x, exp2( - 9.28 * dotNV ) ) * r.x + r.y;
	vec2 fab = vec2( - 1.04, 1.04 ) * a004 + r.zw;
	return fab;
}
vec3 EnvironmentBRDF( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness ) {
	vec2 fab = DFGApprox( normal, viewDir, roughness );
	return specularColor * fab.x + specularF90 * fab.y;
}
#ifdef USE_IRIDESCENCE
void computeMultiscatteringIridescence( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float iridescence, const in vec3 iridescenceF0, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#else
void computeMultiscattering( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#endif
	vec2 fab = DFGApprox( normal, viewDir, roughness );
	#ifdef USE_IRIDESCENCE
		vec3 Fr = mix( specularColor, iridescenceF0, iridescence );
	#else
		vec3 Fr = specularColor;
	#endif
	vec3 FssEss = Fr * fab.x + specularF90 * fab.y;
	float Ess = fab.x + fab.y;
	float Ems = 1.0 - Ess;
	vec3 Favg = Fr + ( 1.0 - Fr ) * 0.047619;	vec3 Fms = FssEss * Favg / ( 1.0 - Ems * Favg );
	singleScatter += FssEss;
	multiScatter += Fms * Ems;
}
#if NUM_RECT_AREA_LIGHTS > 0
	void RE_Direct_RectArea_Physical( const in RectAreaLight rectAreaLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
		vec3 normal = geometryNormal;
		vec3 viewDir = geometryViewDir;
		vec3 position = geometryPosition;
		vec3 lightPos = rectAreaLight.position;
		vec3 halfWidth = rectAreaLight.halfWidth;
		vec3 halfHeight = rectAreaLight.halfHeight;
		vec3 lightColor = rectAreaLight.color;
		float roughness = material.roughness;
		vec3 rectCoords[ 4 ];
		rectCoords[ 0 ] = lightPos + halfWidth - halfHeight;		rectCoords[ 1 ] = lightPos - halfWidth - halfHeight;
		rectCoords[ 2 ] = lightPos - halfWidth + halfHeight;
		rectCoords[ 3 ] = lightPos + halfWidth + halfHeight;
		vec2 uv = LTC_Uv( normal, viewDir, roughness );
		vec4 t1 = texture2D( ltc_1, uv );
		vec4 t2 = texture2D( ltc_2, uv );
		mat3 mInv = mat3(
			vec3( t1.x, 0, t1.y ),
			vec3(    0, 1,    0 ),
			vec3( t1.z, 0, t1.w )
		);
		vec3 fresnel = ( material.specularColor * t2.x + ( vec3( 1.0 ) - material.specularColor ) * t2.y );
		reflectedLight.directSpecular += lightColor * fresnel * LTC_Evaluate( normal, viewDir, position, mInv, rectCoords );
		reflectedLight.directDiffuse += lightColor * material.diffuseColor * LTC_Evaluate( normal, viewDir, position, mat3( 1.0 ), rectCoords );
	}
#endif
void RE_Direct_Physical( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	#ifdef USE_CLEARCOAT
		float dotNLcc = saturate( dot( geometryClearcoatNormal, directLight.direction ) );
		vec3 ccIrradiance = dotNLcc * directLight.color;
		clearcoatSpecularDirect += ccIrradiance * BRDF_GGX_Clearcoat( directLight.direction, geometryViewDir, geometryClearcoatNormal, material );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularDirect += irradiance * BRDF_Sheen( directLight.direction, geometryViewDir, geometryNormal, material.sheenColor, material.sheenRoughness );
	#endif
	reflectedLight.directSpecular += irradiance * BRDF_GGX( directLight.direction, geometryViewDir, geometryNormal, material );
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Physical( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectSpecular_Physical( const in vec3 radiance, const in vec3 irradiance, const in vec3 clearcoatRadiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight) {
	#ifdef USE_CLEARCOAT
		clearcoatSpecularIndirect += clearcoatRadiance * EnvironmentBRDF( geometryClearcoatNormal, geometryViewDir, material.clearcoatF0, material.clearcoatF90, material.clearcoatRoughness );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularIndirect += irradiance * material.sheenColor * IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
	#endif
	vec3 singleScattering = vec3( 0.0 );
	vec3 multiScattering = vec3( 0.0 );
	vec3 cosineWeightedIrradiance = irradiance * RECIPROCAL_PI;
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.iridescence, material.iridescenceFresnel, material.roughness, singleScattering, multiScattering );
	#else
		computeMultiscattering( geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.roughness, singleScattering, multiScattering );
	#endif
	vec3 totalScattering = singleScattering + multiScattering;
	vec3 diffuse = material.diffuseColor * ( 1.0 - max( max( totalScattering.r, totalScattering.g ), totalScattering.b ) );
	reflectedLight.indirectSpecular += radiance * singleScattering;
	reflectedLight.indirectSpecular += multiScattering * cosineWeightedIrradiance;
	reflectedLight.indirectDiffuse += diffuse * cosineWeightedIrradiance;
}
#define RE_Direct				RE_Direct_Physical
#define RE_Direct_RectArea		RE_Direct_RectArea_Physical
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Physical
#define RE_IndirectSpecular		RE_IndirectSpecular_Physical
float computeSpecularOcclusion( const in float dotNV, const in float ambientOcclusion, const in float roughness ) {
	return saturate( pow( dotNV + ambientOcclusion, exp2( - 16.0 * roughness - 1.0 ) ) - 1.0 + ambientOcclusion );
}`,hg=`
vec3 geometryPosition = - vViewPosition;
vec3 geometryNormal = normal;
vec3 geometryViewDir = ( isOrthographic ) ? vec3( 0, 0, 1 ) : normalize( vViewPosition );
vec3 geometryClearcoatNormal = vec3( 0.0 );
#ifdef USE_CLEARCOAT
	geometryClearcoatNormal = clearcoatNormal;
#endif
#ifdef USE_IRIDESCENCE
	float dotNVi = saturate( dot( normal, geometryViewDir ) );
	if ( material.iridescenceThickness == 0.0 ) {
		material.iridescence = 0.0;
	} else {
		material.iridescence = saturate( material.iridescence );
	}
	if ( material.iridescence > 0.0 ) {
		material.iridescenceFresnel = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.specularColor );
		material.iridescenceF0 = Schlick_to_F0( material.iridescenceFresnel, 1.0, dotNVi );
	}
#endif
IncidentLight directLight;
#if ( NUM_POINT_LIGHTS > 0 ) && defined( RE_Direct )
	PointLight pointLight;
	#if defined( USE_SHADOWMAP ) && NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {
		pointLight = pointLights[ i ];
		getPointLightInfo( pointLight, geometryPosition, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_POINT_LIGHT_SHADOWS )
		pointLightShadow = pointLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getPointShadow( pointShadowMap[ i ], pointLightShadow.shadowMapSize, pointLightShadow.shadowIntensity, pointLightShadow.shadowBias, pointLightShadow.shadowRadius, vPointShadowCoord[ i ], pointLightShadow.shadowCameraNear, pointLightShadow.shadowCameraFar ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_SPOT_LIGHTS > 0 ) && defined( RE_Direct )
	SpotLight spotLight;
	vec4 spotColor;
	vec3 spotLightCoord;
	bool inSpotLightMap;
	#if defined( USE_SHADOWMAP ) && NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHTS; i ++ ) {
		spotLight = spotLights[ i ];
		getSpotLightInfo( spotLight, geometryPosition, directLight );
		#if ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#define SPOT_LIGHT_MAP_INDEX UNROLLED_LOOP_INDEX
		#elif ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		#define SPOT_LIGHT_MAP_INDEX NUM_SPOT_LIGHT_MAPS
		#else
		#define SPOT_LIGHT_MAP_INDEX ( UNROLLED_LOOP_INDEX - NUM_SPOT_LIGHT_SHADOWS + NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#endif
		#if ( SPOT_LIGHT_MAP_INDEX < NUM_SPOT_LIGHT_MAPS )
			spotLightCoord = vSpotLightCoord[ i ].xyz / vSpotLightCoord[ i ].w;
			inSpotLightMap = all( lessThan( abs( spotLightCoord * 2. - 1. ), vec3( 1.0 ) ) );
			spotColor = texture2D( spotLightMap[ SPOT_LIGHT_MAP_INDEX ], spotLightCoord.xy );
			directLight.color = inSpotLightMap ? directLight.color * spotColor.rgb : directLight.color;
		#endif
		#undef SPOT_LIGHT_MAP_INDEX
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		spotLightShadow = spotLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( spotShadowMap[ i ], spotLightShadow.shadowMapSize, spotLightShadow.shadowIntensity, spotLightShadow.shadowBias, spotLightShadow.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_DIR_LIGHTS > 0 ) && defined( RE_Direct )
	DirectionalLight directionalLight;
	#if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {
		directionalLight = directionalLights[ i ];
		getDirectionalLightInfo( directionalLight, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_DIR_LIGHT_SHADOWS )
		directionalLightShadow = directionalLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( directionalShadowMap[ i ], directionalLightShadow.shadowMapSize, directionalLightShadow.shadowIntensity, directionalLightShadow.shadowBias, directionalLightShadow.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_RECT_AREA_LIGHTS > 0 ) && defined( RE_Direct_RectArea )
	RectAreaLight rectAreaLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_RECT_AREA_LIGHTS; i ++ ) {
		rectAreaLight = rectAreaLights[ i ];
		RE_Direct_RectArea( rectAreaLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if defined( RE_IndirectDiffuse )
	vec3 iblIrradiance = vec3( 0.0 );
	vec3 irradiance = getAmbientLightIrradiance( ambientLightColor );
	#if defined( USE_LIGHT_PROBES )
		irradiance += getLightProbeIrradiance( lightProbe, geometryNormal );
	#endif
	#if ( NUM_HEMI_LIGHTS > 0 )
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_HEMI_LIGHTS; i ++ ) {
			irradiance += getHemisphereLightIrradiance( hemisphereLights[ i ], geometryNormal );
		}
		#pragma unroll_loop_end
	#endif
#endif
#if defined( RE_IndirectSpecular )
	vec3 radiance = vec3( 0.0 );
	vec3 clearcoatRadiance = vec3( 0.0 );
#endif`,dg=`#if defined( RE_IndirectDiffuse )
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity;
		irradiance += lightMapIrradiance;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD ) && defined( ENVMAP_TYPE_CUBE_UV )
		iblIrradiance += getIBLIrradiance( geometryNormal );
	#endif
#endif
#if defined( USE_ENVMAP ) && defined( RE_IndirectSpecular )
	#ifdef USE_ANISOTROPY
		radiance += getIBLAnisotropyRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );
	#else
		radiance += getIBLRadiance( geometryViewDir, geometryNormal, material.roughness );
	#endif
	#ifdef USE_CLEARCOAT
		clearcoatRadiance += getIBLRadiance( geometryViewDir, geometryClearcoatNormal, material.clearcoatRoughness );
	#endif
#endif`,pg=`#if defined( RE_IndirectDiffuse )
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,mg=`#if defined( USE_LOGDEPTHBUF )
	gl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,gg=`#if defined( USE_LOGDEPTHBUF )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,xg=`#ifdef USE_LOGDEPTHBUF
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,_g=`#ifdef USE_LOGDEPTHBUF
	vFragDepth = 1.0 + gl_Position.w;
	vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
#endif`,yg=`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = sRGBTransferEOTF( sampledDiffuseColor );
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,vg=`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,Sg=`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
	#if defined( USE_POINTS_UV )
		vec2 uv = vUv;
	#else
		vec2 uv = ( uvTransform * vec3( gl_PointCoord.x, 1.0 - gl_PointCoord.y, 1 ) ).xy;
	#endif
#endif
#ifdef USE_MAP
	diffuseColor *= texture2D( map, uv );
#endif
#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, uv ).g;
#endif`,Mg=`#if defined( USE_POINTS_UV )
	varying vec2 vUv;
#else
	#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
		uniform mat3 uvTransform;
	#endif
#endif
#ifdef USE_MAP
	uniform sampler2D map;
#endif
#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,bg=`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,wg=`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,Eg=`#ifdef USE_INSTANCING_MORPH
	float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	float morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		morphTargetInfluences[i] =  texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;
	}
#endif`,Tg=`#if defined( USE_MORPHCOLORS )
	vColor *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,Ag=`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,Cg=`#ifdef USE_MORPHTARGETS
	#ifndef USE_INSTANCING_MORPH
		uniform float morphTargetBaseInfluence;
		uniform float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	#endif
	uniform sampler2DArray morphTargetsTexture;
	uniform ivec2 morphTargetsTextureSize;
	vec4 getMorph( const in int vertexIndex, const in int morphTargetIndex, const in int offset ) {
		int texelIndex = vertexIndex * MORPHTARGETS_TEXTURE_STRIDE + offset;
		int y = texelIndex / morphTargetsTextureSize.x;
		int x = texelIndex - y * morphTargetsTextureSize.x;
		ivec3 morphUV = ivec3( x, y, morphTargetIndex );
		return texelFetch( morphTargetsTexture, morphUV, 0 );
	}
#endif`,Rg=`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,Pg=`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
#ifdef FLAT_SHADED
	vec3 fdx = dFdx( vViewPosition );
	vec3 fdy = dFdy( vViewPosition );
	vec3 normal = normalize( cross( fdx, fdy ) );
#else
	vec3 normal = normalize( vNormal );
	#ifdef DOUBLE_SIDED
		normal *= faceDirection;
	#endif
#endif
#if defined( USE_NORMALMAP_TANGENTSPACE ) || defined( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY )
	#ifdef USE_TANGENT
		mat3 tbn = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn = getTangentFrame( - vViewPosition, normal,
		#if defined( USE_NORMALMAP )
			vNormalMapUv
		#elif defined( USE_CLEARCOAT_NORMALMAP )
			vClearcoatNormalMapUv
		#else
			vUv
		#endif
		);
	#endif
	#if defined( DOUBLE_SIDED ) && ! defined( FLAT_SHADED )
		tbn[0] *= faceDirection;
		tbn[1] *= faceDirection;
	#endif
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	#ifdef USE_TANGENT
		mat3 tbn2 = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn2 = getTangentFrame( - vViewPosition, normal, vClearcoatNormalMapUv );
	#endif
	#if defined( DOUBLE_SIDED ) && ! defined( FLAT_SHADED )
		tbn2[0] *= faceDirection;
		tbn2[1] *= faceDirection;
	#endif
#endif
vec3 nonPerturbedNormal = normal;`,Ig=`#ifdef USE_NORMALMAP_OBJECTSPACE
	normal = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#ifdef FLIP_SIDED
		normal = - normal;
	#endif
	#ifdef DOUBLE_SIDED
		normal = normal * faceDirection;
	#endif
	normal = normalize( normalMatrix * normal );
#elif defined( USE_NORMALMAP_TANGENTSPACE )
	vec3 mapN = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	mapN.xy *= normalScale;
	normal = normalize( tbn * mapN );
#elif defined( USE_BUMPMAP )
	normal = perturbNormalArb( - vViewPosition, normal, dHdxy_fwd(), faceDirection );
#endif`,Lg=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,Dg=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,Ug=`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
	#endif
#endif`,Ng=`#ifdef USE_NORMALMAP
	uniform sampler2D normalMap;
	uniform vec2 normalScale;
#endif
#ifdef USE_NORMALMAP_OBJECTSPACE
	uniform mat3 normalMatrix;
#endif
#if ! defined ( USE_TANGENT ) && ( defined ( USE_NORMALMAP_TANGENTSPACE ) || defined ( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY ) )
	mat3 getTangentFrame( vec3 eye_pos, vec3 surf_norm, vec2 uv ) {
		vec3 q0 = dFdx( eye_pos.xyz );
		vec3 q1 = dFdy( eye_pos.xyz );
		vec2 st0 = dFdx( uv.st );
		vec2 st1 = dFdy( uv.st );
		vec3 N = surf_norm;
		vec3 q1perp = cross( q1, N );
		vec3 q0perp = cross( N, q0 );
		vec3 T = q1perp * st0.x + q0perp * st1.x;
		vec3 B = q1perp * st0.y + q0perp * st1.y;
		float det = max( dot( T, T ), dot( B, B ) );
		float scale = ( det == 0.0 ) ? 0.0 : inversesqrt( det );
		return mat3( T * scale, B * scale, N );
	}
#endif`,Og=`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,Fg=`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,Bg=`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,kg=`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,zg=`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,Hg=`vec3 packNormalToRGB( const in vec3 normal ) {
	return normalize( normal ) * 0.5 + 0.5;
}
vec3 unpackRGBToNormal( const in vec3 rgb ) {
	return 2.0 * rgb.xyz - 1.0;
}
const float PackUpscale = 256. / 255.;const float UnpackDownscale = 255. / 256.;const float ShiftRight8 = 1. / 256.;
const float Inv255 = 1. / 255.;
const vec4 PackFactors = vec4( 1.0, 256.0, 256.0 * 256.0, 256.0 * 256.0 * 256.0 );
const vec2 UnpackFactors2 = vec2( UnpackDownscale, 1.0 / PackFactors.g );
const vec3 UnpackFactors3 = vec3( UnpackDownscale / PackFactors.rg, 1.0 / PackFactors.b );
const vec4 UnpackFactors4 = vec4( UnpackDownscale / PackFactors.rgb, 1.0 / PackFactors.a );
vec4 packDepthToRGBA( const in float v ) {
	if( v <= 0.0 )
		return vec4( 0., 0., 0., 0. );
	if( v >= 1.0 )
		return vec4( 1., 1., 1., 1. );
	float vuf;
	float af = modf( v * PackFactors.a, vuf );
	float bf = modf( vuf * ShiftRight8, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec4( vuf * Inv255, gf * PackUpscale, bf * PackUpscale, af );
}
vec3 packDepthToRGB( const in float v ) {
	if( v <= 0.0 )
		return vec3( 0., 0., 0. );
	if( v >= 1.0 )
		return vec3( 1., 1., 1. );
	float vuf;
	float bf = modf( v * PackFactors.b, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec3( vuf * Inv255, gf * PackUpscale, bf );
}
vec2 packDepthToRG( const in float v ) {
	if( v <= 0.0 )
		return vec2( 0., 0. );
	if( v >= 1.0 )
		return vec2( 1., 1. );
	float vuf;
	float gf = modf( v * 256., vuf );
	return vec2( vuf * Inv255, gf );
}
float unpackRGBAToDepth( const in vec4 v ) {
	return dot( v, UnpackFactors4 );
}
float unpackRGBToDepth( const in vec3 v ) {
	return dot( v, UnpackFactors3 );
}
float unpackRGToDepth( const in vec2 v ) {
	return v.r * UnpackFactors2.r + v.g * UnpackFactors2.g;
}
vec4 pack2HalfToRGBA( const in vec2 v ) {
	vec4 r = vec4( v.x, fract( v.x * 255.0 ), v.y, fract( v.y * 255.0 ) );
	return vec4( r.x - r.y / 255.0, r.y, r.z - r.w / 255.0, r.w );
}
vec2 unpackRGBATo2Half( const in vec4 v ) {
	return vec2( v.x + ( v.y / 255.0 ), v.z + ( v.w / 255.0 ) );
}
float viewZToOrthographicDepth( const in float viewZ, const in float near, const in float far ) {
	return ( viewZ + near ) / ( near - far );
}
float orthographicDepthToViewZ( const in float depth, const in float near, const in float far ) {
	return depth * ( near - far ) - near;
}
float viewZToPerspectiveDepth( const in float viewZ, const in float near, const in float far ) {
	return ( ( near + viewZ ) * far ) / ( ( far - near ) * viewZ );
}
float perspectiveDepthToViewZ( const in float depth, const in float near, const in float far ) {
	return ( near * far ) / ( ( far - near ) * depth - far );
}`,Vg=`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,Gg=`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,Wg=`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,Xg=`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,qg=`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,Yg=`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,$g=`#if NUM_SPOT_LIGHT_COORDS > 0
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#if NUM_SPOT_LIGHT_MAPS > 0
	uniform sampler2D spotLightMap[ NUM_SPOT_LIGHT_MAPS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform sampler2D directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		uniform sampler2D spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform sampler2D pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
	float texture2DCompare( sampler2D depths, vec2 uv, float compare ) {
		return step( compare, unpackRGBAToDepth( texture2D( depths, uv ) ) );
	}
	vec2 texture2DDistribution( sampler2D shadow, vec2 uv ) {
		return unpackRGBATo2Half( texture2D( shadow, uv ) );
	}
	float VSMShadow (sampler2D shadow, vec2 uv, float compare ){
		float occlusion = 1.0;
		vec2 distribution = texture2DDistribution( shadow, uv );
		float hard_shadow = step( compare , distribution.x );
		if (hard_shadow != 1.0 ) {
			float distance = compare - distribution.x ;
			float variance = max( 0.00000, distribution.y * distribution.y );
			float softness_probability = variance / (variance + distance * distance );			softness_probability = clamp( ( softness_probability - 0.3 ) / ( 0.95 - 0.3 ), 0.0, 1.0 );			occlusion = clamp( max( hard_shadow, softness_probability ), 0.0, 1.0 );
		}
		return occlusion;
	}
	float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
		float shadow = 1.0;
		shadowCoord.xyz /= shadowCoord.w;
		shadowCoord.z += shadowBias;
		bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
		bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
		if ( frustumTest ) {
		#if defined( SHADOWMAP_TYPE_PCF )
			vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
			float dx0 = - texelSize.x * shadowRadius;
			float dy0 = - texelSize.y * shadowRadius;
			float dx1 = + texelSize.x * shadowRadius;
			float dy1 = + texelSize.y * shadowRadius;
			float dx2 = dx0 / 2.0;
			float dy2 = dy0 / 2.0;
			float dx3 = dx1 / 2.0;
			float dy3 = dy1 / 2.0;
			shadow = (
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy, shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, dy1 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy1 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, dy1 ), shadowCoord.z )
			) * ( 1.0 / 17.0 );
		#elif defined( SHADOWMAP_TYPE_PCF_SOFT )
			vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
			float dx = texelSize.x;
			float dy = texelSize.y;
			vec2 uv = shadowCoord.xy;
			vec2 f = fract( uv * shadowMapSize + 0.5 );
			uv -= f * texelSize;
			shadow = (
				texture2DCompare( shadowMap, uv, shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + vec2( dx, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + vec2( 0.0, dy ), shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + texelSize, shadowCoord.z ) +
				mix( texture2DCompare( shadowMap, uv + vec2( -dx, 0.0 ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, 0.0 ), shadowCoord.z ),
					 f.x ) +
				mix( texture2DCompare( shadowMap, uv + vec2( -dx, dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, dy ), shadowCoord.z ),
					 f.x ) +
				mix( texture2DCompare( shadowMap, uv + vec2( 0.0, -dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 0.0, 2.0 * dy ), shadowCoord.z ),
					 f.y ) +
				mix( texture2DCompare( shadowMap, uv + vec2( dx, -dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( dx, 2.0 * dy ), shadowCoord.z ),
					 f.y ) +
				mix( mix( texture2DCompare( shadowMap, uv + vec2( -dx, -dy ), shadowCoord.z ),
						  texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, -dy ), shadowCoord.z ),
						  f.x ),
					 mix( texture2DCompare( shadowMap, uv + vec2( -dx, 2.0 * dy ), shadowCoord.z ),
						  texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, 2.0 * dy ), shadowCoord.z ),
						  f.x ),
					 f.y )
			) * ( 1.0 / 9.0 );
		#elif defined( SHADOWMAP_TYPE_VSM )
			shadow = VSMShadow( shadowMap, shadowCoord.xy, shadowCoord.z );
		#else
			shadow = texture2DCompare( shadowMap, shadowCoord.xy, shadowCoord.z );
		#endif
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	vec2 cubeToUV( vec3 v, float texelSizeY ) {
		vec3 absV = abs( v );
		float scaleToCube = 1.0 / max( absV.x, max( absV.y, absV.z ) );
		absV *= scaleToCube;
		v *= scaleToCube * ( 1.0 - 2.0 * texelSizeY );
		vec2 planar = v.xy;
		float almostATexel = 1.5 * texelSizeY;
		float almostOne = 1.0 - almostATexel;
		if ( absV.z >= almostOne ) {
			if ( v.z > 0.0 )
				planar.x = 4.0 - v.x;
		} else if ( absV.x >= almostOne ) {
			float signX = sign( v.x );
			planar.x = v.z * signX + 2.0 * signX;
		} else if ( absV.y >= almostOne ) {
			float signY = sign( v.y );
			planar.x = v.x + 2.0 * signY + 2.0;
			planar.y = v.z * signY - 2.0;
		}
		return vec2( 0.125, 0.25 ) * planar + vec2( 0.375, 0.75 );
	}
	float getPointShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		
		float lightToPositionLength = length( lightToPosition );
		if ( lightToPositionLength - shadowCameraFar <= 0.0 && lightToPositionLength - shadowCameraNear >= 0.0 ) {
			float dp = ( lightToPositionLength - shadowCameraNear ) / ( shadowCameraFar - shadowCameraNear );			dp += shadowBias;
			vec3 bd3D = normalize( lightToPosition );
			vec2 texelSize = vec2( 1.0 ) / ( shadowMapSize * vec2( 4.0, 2.0 ) );
			#if defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_PCF_SOFT ) || defined( SHADOWMAP_TYPE_VSM )
				vec2 offset = vec2( - 1, 1 ) * shadowRadius * texelSize.y;
				shadow = (
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xyy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yyy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xyx, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yyx, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xxy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yxy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xxx, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yxx, texelSize.y ), dp )
				) * ( 1.0 / 9.0 );
			#else
				shadow = texture2DCompare( shadowMap, cubeToUV( bd3D, texelSize.y ), dp );
			#endif
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
#endif`,Zg=`#if NUM_SPOT_LIGHT_COORDS > 0
	uniform mat4 spotLightMatrix[ NUM_SPOT_LIGHT_COORDS ];
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform mat4 directionalShadowMatrix[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform mat4 pointShadowMatrix[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
#endif`,Kg=`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
	vec3 shadowWorldNormal = inverseTransformDirection( transformedNormal, viewMatrix );
	vec4 shadowWorldPosition;
#endif
#if defined( USE_SHADOWMAP )
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * directionalLightShadows[ i ].shadowNormalBias, 0 );
			vDirectionalShadowCoord[ i ] = directionalShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * pointLightShadows[ i ].shadowNormalBias, 0 );
			vPointShadowCoord[ i ] = pointShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
#endif
#if NUM_SPOT_LIGHT_COORDS > 0
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_COORDS; i ++ ) {
		shadowWorldPosition = worldPosition;
		#if ( defined( USE_SHADOWMAP ) && UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
			shadowWorldPosition.xyz += shadowWorldNormal * spotLightShadows[ i ].shadowNormalBias;
		#endif
		vSpotLightCoord[ i ] = spotLightMatrix[ i ] * shadowWorldPosition;
	}
	#pragma unroll_loop_end
#endif`,Jg=`float getShadowMask() {
	float shadow = 1.0;
	#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
		directionalLight = directionalLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( directionalShadowMap[ i ], directionalLight.shadowMapSize, directionalLight.shadowIntensity, directionalLight.shadowBias, directionalLight.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_SHADOWS; i ++ ) {
		spotLight = spotLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( spotShadowMap[ i ], spotLight.shadowMapSize, spotLight.shadowIntensity, spotLight.shadowBias, spotLight.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
		pointLight = pointLightShadows[ i ];
		shadow *= receiveShadow ? getPointShadow( pointShadowMap[ i ], pointLight.shadowMapSize, pointLight.shadowIntensity, pointLight.shadowBias, pointLight.shadowRadius, vPointShadowCoord[ i ], pointLight.shadowCameraNear, pointLight.shadowCameraFar ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#endif
	return shadow;
}`,jg=`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,Qg=`#ifdef USE_SKINNING
	uniform mat4 bindMatrix;
	uniform mat4 bindMatrixInverse;
	uniform highp sampler2D boneTexture;
	mat4 getBoneMatrix( const in float i ) {
		int size = textureSize( boneTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( boneTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( boneTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( boneTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( boneTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
#endif`,ex=`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,tx=`#ifdef USE_SKINNING
	mat4 skinMatrix = mat4( 0.0 );
	skinMatrix += skinWeight.x * boneMatX;
	skinMatrix += skinWeight.y * boneMatY;
	skinMatrix += skinWeight.z * boneMatZ;
	skinMatrix += skinWeight.w * boneMatW;
	skinMatrix = bindMatrixInverse * skinMatrix * bindMatrix;
	objectNormal = vec4( skinMatrix * vec4( objectNormal, 0.0 ) ).xyz;
	#ifdef USE_TANGENT
		objectTangent = vec4( skinMatrix * vec4( objectTangent, 0.0 ) ).xyz;
	#endif
#endif`,nx=`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,ix=`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,rx=`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,sx=`#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
uniform float toneMappingExposure;
vec3 LinearToneMapping( vec3 color ) {
	return saturate( toneMappingExposure * color );
}
vec3 ReinhardToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	return saturate( color / ( vec3( 1.0 ) + color ) );
}
vec3 CineonToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	color = max( vec3( 0.0 ), color - 0.004 );
	return pow( ( color * ( 6.2 * color + 0.5 ) ) / ( color * ( 6.2 * color + 1.7 ) + 0.06 ), vec3( 2.2 ) );
}
vec3 RRTAndODTFit( vec3 v ) {
	vec3 a = v * ( v + 0.0245786 ) - 0.000090537;
	vec3 b = v * ( 0.983729 * v + 0.4329510 ) + 0.238081;
	return a / b;
}
vec3 ACESFilmicToneMapping( vec3 color ) {
	const mat3 ACESInputMat = mat3(
		vec3( 0.59719, 0.07600, 0.02840 ),		vec3( 0.35458, 0.90834, 0.13383 ),
		vec3( 0.04823, 0.01566, 0.83777 )
	);
	const mat3 ACESOutputMat = mat3(
		vec3(  1.60475, -0.10208, -0.00327 ),		vec3( -0.53108,  1.10813, -0.07276 ),
		vec3( -0.07367, -0.00605,  1.07602 )
	);
	color *= toneMappingExposure / 0.6;
	color = ACESInputMat * color;
	color = RRTAndODTFit( color );
	color = ACESOutputMat * color;
	return saturate( color );
}
const mat3 LINEAR_REC2020_TO_LINEAR_SRGB = mat3(
	vec3( 1.6605, - 0.1246, - 0.0182 ),
	vec3( - 0.5876, 1.1329, - 0.1006 ),
	vec3( - 0.0728, - 0.0083, 1.1187 )
);
const mat3 LINEAR_SRGB_TO_LINEAR_REC2020 = mat3(
	vec3( 0.6274, 0.0691, 0.0164 ),
	vec3( 0.3293, 0.9195, 0.0880 ),
	vec3( 0.0433, 0.0113, 0.8956 )
);
vec3 agxDefaultContrastApprox( vec3 x ) {
	vec3 x2 = x * x;
	vec3 x4 = x2 * x2;
	return + 15.5 * x4 * x2
		- 40.14 * x4 * x
		+ 31.96 * x4
		- 6.868 * x2 * x
		+ 0.4298 * x2
		+ 0.1191 * x
		- 0.00232;
}
vec3 AgXToneMapping( vec3 color ) {
	const mat3 AgXInsetMatrix = mat3(
		vec3( 0.856627153315983, 0.137318972929847, 0.11189821299995 ),
		vec3( 0.0951212405381588, 0.761241990602591, 0.0767994186031903 ),
		vec3( 0.0482516061458583, 0.101439036467562, 0.811302368396859 )
	);
	const mat3 AgXOutsetMatrix = mat3(
		vec3( 1.1271005818144368, - 0.1413297634984383, - 0.14132976349843826 ),
		vec3( - 0.11060664309660323, 1.157823702216272, - 0.11060664309660294 ),
		vec3( - 0.016493938717834573, - 0.016493938717834257, 1.2519364065950405 )
	);
	const float AgxMinEv = - 12.47393;	const float AgxMaxEv = 4.026069;
	color *= toneMappingExposure;
	color = LINEAR_SRGB_TO_LINEAR_REC2020 * color;
	color = AgXInsetMatrix * color;
	color = max( color, 1e-10 );	color = log2( color );
	color = ( color - AgxMinEv ) / ( AgxMaxEv - AgxMinEv );
	color = clamp( color, 0.0, 1.0 );
	color = agxDefaultContrastApprox( color );
	color = AgXOutsetMatrix * color;
	color = pow( max( vec3( 0.0 ), color ), vec3( 2.2 ) );
	color = LINEAR_REC2020_TO_LINEAR_SRGB * color;
	color = clamp( color, 0.0, 1.0 );
	return color;
}
vec3 NeutralToneMapping( vec3 color ) {
	const float StartCompression = 0.8 - 0.04;
	const float Desaturation = 0.15;
	color *= toneMappingExposure;
	float x = min( color.r, min( color.g, color.b ) );
	float offset = x < 0.08 ? x - 6.25 * x * x : 0.04;
	color -= offset;
	float peak = max( color.r, max( color.g, color.b ) );
	if ( peak < StartCompression ) return color;
	float d = 1. - StartCompression;
	float newPeak = 1. - d * d / ( peak + d - StartCompression );
	color *= newPeak / peak;
	float g = 1. - 1. / ( Desaturation * ( peak - newPeak ) + 1. );
	return mix( color, vec3( newPeak ), g );
}
vec3 CustomToneMapping( vec3 color ) { return color; }`,ax=`#ifdef USE_TRANSMISSION
	material.transmission = transmission;
	material.transmissionAlpha = 1.0;
	material.thickness = thickness;
	material.attenuationDistance = attenuationDistance;
	material.attenuationColor = attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		material.transmission *= texture2D( transmissionMap, vTransmissionMapUv ).r;
	#endif
	#ifdef USE_THICKNESSMAP
		material.thickness *= texture2D( thicknessMap, vThicknessMapUv ).g;
	#endif
	vec3 pos = vWorldPosition;
	vec3 v = normalize( cameraPosition - pos );
	vec3 n = inverseTransformDirection( normal, viewMatrix );
	vec4 transmitted = getIBLVolumeRefraction(
		n, v, material.roughness, material.diffuseColor, material.specularColor, material.specularF90,
		pos, modelMatrix, viewMatrix, projectionMatrix, material.dispersion, material.ior, material.thickness,
		material.attenuationColor, material.attenuationDistance );
	material.transmissionAlpha = mix( material.transmissionAlpha, transmitted.a, material.transmission );
	totalDiffuse = mix( totalDiffuse, transmitted.rgb, material.transmission );
#endif`,ox=`#ifdef USE_TRANSMISSION
	uniform float transmission;
	uniform float thickness;
	uniform float attenuationDistance;
	uniform vec3 attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		uniform sampler2D transmissionMap;
	#endif
	#ifdef USE_THICKNESSMAP
		uniform sampler2D thicknessMap;
	#endif
	uniform vec2 transmissionSamplerSize;
	uniform sampler2D transmissionSamplerMap;
	uniform mat4 modelMatrix;
	uniform mat4 projectionMatrix;
	varying vec3 vWorldPosition;
	float w0( float a ) {
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - a + 3.0 ) - 3.0 ) + 1.0 );
	}
	float w1( float a ) {
		return ( 1.0 / 6.0 ) * ( a *  a * ( 3.0 * a - 6.0 ) + 4.0 );
	}
	float w2( float a ){
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - 3.0 * a + 3.0 ) + 3.0 ) + 1.0 );
	}
	float w3( float a ) {
		return ( 1.0 / 6.0 ) * ( a * a * a );
	}
	float g0( float a ) {
		return w0( a ) + w1( a );
	}
	float g1( float a ) {
		return w2( a ) + w3( a );
	}
	float h0( float a ) {
		return - 1.0 + w1( a ) / ( w0( a ) + w1( a ) );
	}
	float h1( float a ) {
		return 1.0 + w3( a ) / ( w2( a ) + w3( a ) );
	}
	vec4 bicubic( sampler2D tex, vec2 uv, vec4 texelSize, float lod ) {
		uv = uv * texelSize.zw + 0.5;
		vec2 iuv = floor( uv );
		vec2 fuv = fract( uv );
		float g0x = g0( fuv.x );
		float g1x = g1( fuv.x );
		float h0x = h0( fuv.x );
		float h1x = h1( fuv.x );
		float h0y = h0( fuv.y );
		float h1y = h1( fuv.y );
		vec2 p0 = ( vec2( iuv.x + h0x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p1 = ( vec2( iuv.x + h1x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p2 = ( vec2( iuv.x + h0x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		vec2 p3 = ( vec2( iuv.x + h1x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		return g0( fuv.y ) * ( g0x * textureLod( tex, p0, lod ) + g1x * textureLod( tex, p1, lod ) ) +
			g1( fuv.y ) * ( g0x * textureLod( tex, p2, lod ) + g1x * textureLod( tex, p3, lod ) );
	}
	vec4 textureBicubic( sampler2D sampler, vec2 uv, float lod ) {
		vec2 fLodSize = vec2( textureSize( sampler, int( lod ) ) );
		vec2 cLodSize = vec2( textureSize( sampler, int( lod + 1.0 ) ) );
		vec2 fLodSizeInv = 1.0 / fLodSize;
		vec2 cLodSizeInv = 1.0 / cLodSize;
		vec4 fSample = bicubic( sampler, uv, vec4( fLodSizeInv, fLodSize ), floor( lod ) );
		vec4 cSample = bicubic( sampler, uv, vec4( cLodSizeInv, cLodSize ), ceil( lod ) );
		return mix( fSample, cSample, fract( lod ) );
	}
	vec3 getVolumeTransmissionRay( const in vec3 n, const in vec3 v, const in float thickness, const in float ior, const in mat4 modelMatrix ) {
		vec3 refractionVector = refract( - v, normalize( n ), 1.0 / ior );
		vec3 modelScale;
		modelScale.x = length( vec3( modelMatrix[ 0 ].xyz ) );
		modelScale.y = length( vec3( modelMatrix[ 1 ].xyz ) );
		modelScale.z = length( vec3( modelMatrix[ 2 ].xyz ) );
		return normalize( refractionVector ) * thickness * modelScale;
	}
	float applyIorToRoughness( const in float roughness, const in float ior ) {
		return roughness * clamp( ior * 2.0 - 2.0, 0.0, 1.0 );
	}
	vec4 getTransmissionSample( const in vec2 fragCoord, const in float roughness, const in float ior ) {
		float lod = log2( transmissionSamplerSize.x ) * applyIorToRoughness( roughness, ior );
		return textureBicubic( transmissionSamplerMap, fragCoord.xy, lod );
	}
	vec3 volumeAttenuation( const in float transmissionDistance, const in vec3 attenuationColor, const in float attenuationDistance ) {
		if ( isinf( attenuationDistance ) ) {
			return vec3( 1.0 );
		} else {
			vec3 attenuationCoefficient = -log( attenuationColor ) / attenuationDistance;
			vec3 transmittance = exp( - attenuationCoefficient * transmissionDistance );			return transmittance;
		}
	}
	vec4 getIBLVolumeRefraction( const in vec3 n, const in vec3 v, const in float roughness, const in vec3 diffuseColor,
		const in vec3 specularColor, const in float specularF90, const in vec3 position, const in mat4 modelMatrix,
		const in mat4 viewMatrix, const in mat4 projMatrix, const in float dispersion, const in float ior, const in float thickness,
		const in vec3 attenuationColor, const in float attenuationDistance ) {
		vec4 transmittedLight;
		vec3 transmittance;
		#ifdef USE_DISPERSION
			float halfSpread = ( ior - 1.0 ) * 0.025 * dispersion;
			vec3 iors = vec3( ior - halfSpread, ior, ior + halfSpread );
			for ( int i = 0; i < 3; i ++ ) {
				vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, iors[ i ], modelMatrix );
				vec3 refractedRayExit = position + transmissionRay;
		
				vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
				vec2 refractionCoords = ndcPos.xy / ndcPos.w;
				refractionCoords += 1.0;
				refractionCoords /= 2.0;
		
				vec4 transmissionSample = getTransmissionSample( refractionCoords, roughness, iors[ i ] );
				transmittedLight[ i ] = transmissionSample[ i ];
				transmittedLight.a += transmissionSample.a;
				transmittance[ i ] = diffuseColor[ i ] * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance )[ i ];
			}
			transmittedLight.a /= 3.0;
		
		#else
		
			vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, ior, modelMatrix );
			vec3 refractedRayExit = position + transmissionRay;
			vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
			vec2 refractionCoords = ndcPos.xy / ndcPos.w;
			refractionCoords += 1.0;
			refractionCoords /= 2.0;
			transmittedLight = getTransmissionSample( refractionCoords, roughness, ior );
			transmittance = diffuseColor * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance );
		
		#endif
		vec3 attenuatedColor = transmittance * transmittedLight.rgb;
		vec3 F = EnvironmentBRDF( n, v, specularColor, specularF90, roughness );
		float transmittanceFactor = ( transmittance.r + transmittance.g + transmittance.b ) / 3.0;
		return vec4( ( 1.0 - F ) * attenuatedColor, 1.0 - ( 1.0 - transmittedLight.a ) * transmittanceFactor );
	}
#endif`,lx=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_SPECULARMAP
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,cx=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	uniform mat3 mapTransform;
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	uniform mat3 alphaMapTransform;
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	uniform mat3 lightMapTransform;
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	uniform mat3 aoMapTransform;
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	uniform mat3 bumpMapTransform;
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	uniform mat3 normalMapTransform;
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_DISPLACEMENTMAP
	uniform mat3 displacementMapTransform;
	varying vec2 vDisplacementMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	uniform mat3 emissiveMapTransform;
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	uniform mat3 metalnessMapTransform;
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	uniform mat3 roughnessMapTransform;
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	uniform mat3 anisotropyMapTransform;
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	uniform mat3 clearcoatMapTransform;
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform mat3 clearcoatNormalMapTransform;
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform mat3 clearcoatRoughnessMapTransform;
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	uniform mat3 sheenColorMapTransform;
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	uniform mat3 sheenRoughnessMapTransform;
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	uniform mat3 iridescenceMapTransform;
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform mat3 iridescenceThicknessMapTransform;
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SPECULARMAP
	uniform mat3 specularMapTransform;
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	uniform mat3 specularColorMapTransform;
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	uniform mat3 specularIntensityMapTransform;
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,ux=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	vUv = vec3( uv, 1 ).xy;
#endif
#ifdef USE_MAP
	vMapUv = ( mapTransform * vec3( MAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ALPHAMAP
	vAlphaMapUv = ( alphaMapTransform * vec3( ALPHAMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_LIGHTMAP
	vLightMapUv = ( lightMapTransform * vec3( LIGHTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_AOMAP
	vAoMapUv = ( aoMapTransform * vec3( AOMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_BUMPMAP
	vBumpMapUv = ( bumpMapTransform * vec3( BUMPMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_NORMALMAP
	vNormalMapUv = ( normalMapTransform * vec3( NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_DISPLACEMENTMAP
	vDisplacementMapUv = ( displacementMapTransform * vec3( DISPLACEMENTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_EMISSIVEMAP
	vEmissiveMapUv = ( emissiveMapTransform * vec3( EMISSIVEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_METALNESSMAP
	vMetalnessMapUv = ( metalnessMapTransform * vec3( METALNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ROUGHNESSMAP
	vRoughnessMapUv = ( roughnessMapTransform * vec3( ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ANISOTROPYMAP
	vAnisotropyMapUv = ( anisotropyMapTransform * vec3( ANISOTROPYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOATMAP
	vClearcoatMapUv = ( clearcoatMapTransform * vec3( CLEARCOATMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	vClearcoatNormalMapUv = ( clearcoatNormalMapTransform * vec3( CLEARCOAT_NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	vClearcoatRoughnessMapUv = ( clearcoatRoughnessMapTransform * vec3( CLEARCOAT_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCEMAP
	vIridescenceMapUv = ( iridescenceMapTransform * vec3( IRIDESCENCEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	vIridescenceThicknessMapUv = ( iridescenceThicknessMapTransform * vec3( IRIDESCENCE_THICKNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_COLORMAP
	vSheenColorMapUv = ( sheenColorMapTransform * vec3( SHEEN_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	vSheenRoughnessMapUv = ( sheenRoughnessMapTransform * vec3( SHEEN_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULARMAP
	vSpecularMapUv = ( specularMapTransform * vec3( SPECULARMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_COLORMAP
	vSpecularColorMapUv = ( specularColorMapTransform * vec3( SPECULAR_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	vSpecularIntensityMapUv = ( specularIntensityMapTransform * vec3( SPECULAR_INTENSITYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_TRANSMISSIONMAP
	vTransmissionMapUv = ( transmissionMapTransform * vec3( TRANSMISSIONMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_THICKNESSMAP
	vThicknessMapUv = ( thicknessMapTransform * vec3( THICKNESSMAP_UV, 1 ) ).xy;
#endif`,fx=`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`,hx=`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,dx=`uniform sampler2D t2D;
uniform float backgroundIntensity;
varying vec2 vUv;
void main() {
	vec4 texColor = texture2D( t2D, vUv );
	#ifdef DECODE_VIDEO_TEXTURE
		texColor = vec4( mix( pow( texColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), texColor.rgb * 0.0773993808, vec3( lessThanEqual( texColor.rgb, vec3( 0.04045 ) ) ) ), texColor.w );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,px=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,mx=`#ifdef ENVMAP_TYPE_CUBE
	uniform samplerCube envMap;
#elif defined( ENVMAP_TYPE_CUBE_UV )
	uniform sampler2D envMap;
#endif
uniform float flipEnvMap;
uniform float backgroundBlurriness;
uniform float backgroundIntensity;
uniform mat3 backgroundRotation;
varying vec3 vWorldDirection;
#include <cube_uv_reflection_fragment>
void main() {
	#ifdef ENVMAP_TYPE_CUBE
		vec4 texColor = textureCube( envMap, backgroundRotation * vec3( flipEnvMap * vWorldDirection.x, vWorldDirection.yz ) );
	#elif defined( ENVMAP_TYPE_CUBE_UV )
		vec4 texColor = textureCubeUV( envMap, backgroundRotation * vWorldDirection, backgroundBlurriness );
	#else
		vec4 texColor = vec4( 0.0, 0.0, 0.0, 1.0 );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,gx=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,xx=`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,_x=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
varying vec2 vHighPrecisionZW;
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vHighPrecisionZW = gl_Position.zw;
}`,yx=`#if DEPTH_PACKING == 3200
	uniform float opacity;
#endif
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
varying vec2 vHighPrecisionZW;
void main() {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#if DEPTH_PACKING == 3200
		diffuseColor.a = opacity;
	#endif
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <logdepthbuf_fragment>
	float fragCoordZ = 0.5 * vHighPrecisionZW[0] / vHighPrecisionZW[1] + 0.5;
	#if DEPTH_PACKING == 3200
		gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );
	#elif DEPTH_PACKING == 3201
		gl_FragColor = packDepthToRGBA( fragCoordZ );
	#elif DEPTH_PACKING == 3202
		gl_FragColor = vec4( packDepthToRGB( fragCoordZ ), 1.0 );
	#elif DEPTH_PACKING == 3203
		gl_FragColor = vec4( packDepthToRG( fragCoordZ ), 0.0, 1.0 );
	#endif
}`,vx=`#define DISTANCE
varying vec3 vWorldPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <worldpos_vertex>
	#include <clipping_planes_vertex>
	vWorldPosition = worldPosition.xyz;
}`,Sx=`#define DISTANCE
uniform vec3 referencePosition;
uniform float nearDistance;
uniform float farDistance;
varying vec3 vWorldPosition;
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <clipping_planes_pars_fragment>
void main () {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	float dist = length( vWorldPosition - referencePosition );
	dist = ( dist - nearDistance ) / ( farDistance - nearDistance );
	dist = saturate( dist );
	gl_FragColor = packDepthToRGBA( dist );
}`,Mx=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,bx=`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,wx=`uniform float scale;
attribute float lineDistance;
varying float vLineDistance;
#include <common>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	vLineDistance = scale * lineDistance;
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,Ex=`uniform vec3 diffuse;
uniform float opacity;
uniform float dashSize;
uniform float totalSize;
varying float vLineDistance;
#include <common>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	if ( mod( vLineDistance, totalSize ) > dashSize ) {
		discard;
	}
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,Tx=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#if defined ( USE_ENVMAP ) || defined ( USE_SKINNING )
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinbase_vertex>
		#include <skinnormal_vertex>
		#include <defaultnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <fog_vertex>
}`,Ax=`uniform vec3 diffuse;
uniform float opacity;
#ifndef FLAT_SHADED
	varying vec3 vNormal;
#endif
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		reflectedLight.indirectDiffuse += lightMapTexel.rgb * lightMapIntensity * RECIPROCAL_PI;
	#else
		reflectedLight.indirectDiffuse += vec3( 1.0 );
	#endif
	#include <aomap_fragment>
	reflectedLight.indirectDiffuse *= diffuseColor.rgb;
	vec3 outgoingLight = reflectedLight.indirectDiffuse;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Cx=`#define LAMBERT
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,Rx=`#define LAMBERT
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_lambert_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_lambert_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Px=`#define MATCAP
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <displacementmap_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
	vViewPosition = - mvPosition.xyz;
}`,Ix=`#define MATCAP
uniform vec3 diffuse;
uniform float opacity;
uniform sampler2D matcap;
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	vec3 viewDir = normalize( vViewPosition );
	vec3 x = normalize( vec3( viewDir.z, 0.0, - viewDir.x ) );
	vec3 y = cross( viewDir, x );
	vec2 uv = vec2( dot( x, normal ), dot( y, normal ) ) * 0.495 + 0.5;
	#ifdef USE_MATCAP
		vec4 matcapColor = texture2D( matcap, uv );
	#else
		vec4 matcapColor = vec4( vec3( mix( 0.2, 0.8, uv.y ) ), 1.0 );
	#endif
	vec3 outgoingLight = diffuseColor.rgb * matcapColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Lx=`#define NORMAL
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	vViewPosition = - mvPosition.xyz;
#endif
}`,Dx=`#define NORMAL
uniform float opacity;
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <packing>
#include <uv_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( 0.0, 0.0, 0.0, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	gl_FragColor = vec4( packNormalToRGB( normal ), diffuseColor.a );
	#ifdef OPAQUE
		gl_FragColor.a = 1.0;
	#endif
}`,Ux=`#define PHONG
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,Nx=`#define PHONG
uniform vec3 diffuse;
uniform vec3 emissive;
uniform vec3 specular;
uniform float shininess;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_phong_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_phong_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Ox=`#define STANDARD
varying vec3 vViewPosition;
#ifdef USE_TRANSMISSION
	varying vec3 vWorldPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
#ifdef USE_TRANSMISSION
	vWorldPosition = worldPosition.xyz;
#endif
}`,Fx=`#define STANDARD
#ifdef PHYSICAL
	#define IOR
	#define USE_SPECULAR
#endif
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float roughness;
uniform float metalness;
uniform float opacity;
#ifdef IOR
	uniform float ior;
#endif
#ifdef USE_SPECULAR
	uniform float specularIntensity;
	uniform vec3 specularColor;
	#ifdef USE_SPECULAR_COLORMAP
		uniform sampler2D specularColorMap;
	#endif
	#ifdef USE_SPECULAR_INTENSITYMAP
		uniform sampler2D specularIntensityMap;
	#endif
#endif
#ifdef USE_CLEARCOAT
	uniform float clearcoat;
	uniform float clearcoatRoughness;
#endif
#ifdef USE_DISPERSION
	uniform float dispersion;
#endif
#ifdef USE_IRIDESCENCE
	uniform float iridescence;
	uniform float iridescenceIOR;
	uniform float iridescenceThicknessMinimum;
	uniform float iridescenceThicknessMaximum;
#endif
#ifdef USE_SHEEN
	uniform vec3 sheenColor;
	uniform float sheenRoughness;
	#ifdef USE_SHEEN_COLORMAP
		uniform sampler2D sheenColorMap;
	#endif
	#ifdef USE_SHEEN_ROUGHNESSMAP
		uniform sampler2D sheenRoughnessMap;
	#endif
#endif
#ifdef USE_ANISOTROPY
	uniform vec2 anisotropyVector;
	#ifdef USE_ANISOTROPYMAP
		uniform sampler2D anisotropyMap;
	#endif
#endif
varying vec3 vViewPosition;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <iridescence_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_physical_pars_fragment>
#include <transmission_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <clearcoat_pars_fragment>
#include <iridescence_pars_fragment>
#include <roughnessmap_pars_fragment>
#include <metalnessmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <roughnessmap_fragment>
	#include <metalnessmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <clearcoat_normal_fragment_begin>
	#include <clearcoat_normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_physical_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 totalDiffuse = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse;
	vec3 totalSpecular = reflectedLight.directSpecular + reflectedLight.indirectSpecular;
	#include <transmission_fragment>
	vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;
	#ifdef USE_SHEEN
		float sheenEnergyComp = 1.0 - 0.157 * max3( material.sheenColor );
		outgoingLight = outgoingLight * sheenEnergyComp + sheenSpecularDirect + sheenSpecularIndirect;
	#endif
	#ifdef USE_CLEARCOAT
		float dotNVcc = saturate( dot( geometryClearcoatNormal, geometryViewDir ) );
		vec3 Fcc = F_Schlick( material.clearcoatF0, material.clearcoatF90, dotNVcc );
		outgoingLight = outgoingLight * ( 1.0 - material.clearcoat * Fcc ) + ( clearcoatSpecularDirect + clearcoatSpecularIndirect ) * material.clearcoat;
	#endif
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Bx=`#define TOON
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,kx=`#define TOON
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <gradientmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_toon_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_toon_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,zx=`uniform float size;
uniform float scale;
#include <common>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
#ifdef USE_POINTS_UV
	varying vec2 vUv;
	uniform mat3 uvTransform;
#endif
void main() {
	#ifdef USE_POINTS_UV
		vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	#endif
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	gl_PointSize = size;
	#ifdef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) gl_PointSize *= ( scale / - mvPosition.z );
	#endif
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <fog_vertex>
}`,Hx=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <color_pars_fragment>
#include <map_particle_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_particle_fragment>
	#include <color_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,Vx=`#include <common>
#include <batching_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <shadowmap_pars_vertex>
void main() {
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,Gx=`uniform vec3 color;
uniform float opacity;
#include <common>
#include <packing>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <logdepthbuf_pars_fragment>
#include <shadowmap_pars_fragment>
#include <shadowmask_pars_fragment>
void main() {
	#include <logdepthbuf_fragment>
	gl_FragColor = vec4( color, opacity * ( 1.0 - getShadowMask() ) );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`,Wx=`uniform float rotation;
uniform vec2 center;
#include <common>
#include <uv_pars_vertex>
#include <fog_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	vec4 mvPosition = modelViewMatrix[ 3 ];
	vec2 scale = vec2( length( modelMatrix[ 0 ].xyz ), length( modelMatrix[ 1 ].xyz ) );
	#ifndef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) scale *= - mvPosition.z;
	#endif
	vec2 alignedPosition = ( position.xy - ( center - vec2( 0.5 ) ) ) * scale;
	vec2 rotatedPosition;
	rotatedPosition.x = cos( rotation ) * alignedPosition.x - sin( rotation ) * alignedPosition.y;
	rotatedPosition.y = sin( rotation ) * alignedPosition.x + cos( rotation ) * alignedPosition.y;
	mvPosition.xy += rotatedPosition;
	gl_Position = projectionMatrix * mvPosition;
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,Xx=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`,Fe={alphahash_fragment:dm,alphahash_pars_fragment:pm,alphamap_fragment:mm,alphamap_pars_fragment:gm,alphatest_fragment:xm,alphatest_pars_fragment:_m,aomap_fragment:ym,aomap_pars_fragment:vm,batching_pars_vertex:Sm,batching_vertex:Mm,begin_vertex:bm,beginnormal_vertex:wm,bsdfs:Em,iridescence_fragment:Tm,bumpmap_pars_fragment:Am,clipping_planes_fragment:Cm,clipping_planes_pars_fragment:Rm,clipping_planes_pars_vertex:Pm,clipping_planes_vertex:Im,color_fragment:Lm,color_pars_fragment:Dm,color_pars_vertex:Um,color_vertex:Nm,common:Om,cube_uv_reflection_fragment:Fm,defaultnormal_vertex:Bm,displacementmap_pars_vertex:km,displacementmap_vertex:zm,emissivemap_fragment:Hm,emissivemap_pars_fragment:Vm,colorspace_fragment:Gm,colorspace_pars_fragment:Wm,envmap_fragment:Xm,envmap_common_pars_fragment:qm,envmap_pars_fragment:Ym,envmap_pars_vertex:$m,envmap_physical_pars_fragment:sg,envmap_vertex:Zm,fog_vertex:Km,fog_pars_vertex:Jm,fog_fragment:jm,fog_pars_fragment:Qm,gradientmap_pars_fragment:eg,lightmap_pars_fragment:tg,lights_lambert_fragment:ng,lights_lambert_pars_fragment:ig,lights_pars_begin:rg,lights_toon_fragment:ag,lights_toon_pars_fragment:og,lights_phong_fragment:lg,lights_phong_pars_fragment:cg,lights_physical_fragment:ug,lights_physical_pars_fragment:fg,lights_fragment_begin:hg,lights_fragment_maps:dg,lights_fragment_end:pg,logdepthbuf_fragment:mg,logdepthbuf_pars_fragment:gg,logdepthbuf_pars_vertex:xg,logdepthbuf_vertex:_g,map_fragment:yg,map_pars_fragment:vg,map_particle_fragment:Sg,map_particle_pars_fragment:Mg,metalnessmap_fragment:bg,metalnessmap_pars_fragment:wg,morphinstance_vertex:Eg,morphcolor_vertex:Tg,morphnormal_vertex:Ag,morphtarget_pars_vertex:Cg,morphtarget_vertex:Rg,normal_fragment_begin:Pg,normal_fragment_maps:Ig,normal_pars_fragment:Lg,normal_pars_vertex:Dg,normal_vertex:Ug,normalmap_pars_fragment:Ng,clearcoat_normal_fragment_begin:Og,clearcoat_normal_fragment_maps:Fg,clearcoat_pars_fragment:Bg,iridescence_pars_fragment:kg,opaque_fragment:zg,packing:Hg,premultiplied_alpha_fragment:Vg,project_vertex:Gg,dithering_fragment:Wg,dithering_pars_fragment:Xg,roughnessmap_fragment:qg,roughnessmap_pars_fragment:Yg,shadowmap_pars_fragment:$g,shadowmap_pars_vertex:Zg,shadowmap_vertex:Kg,shadowmask_pars_fragment:Jg,skinbase_vertex:jg,skinning_pars_vertex:Qg,skinning_vertex:ex,skinnormal_vertex:tx,specularmap_fragment:nx,specularmap_pars_fragment:ix,tonemapping_fragment:rx,tonemapping_pars_fragment:sx,transmission_fragment:ax,transmission_pars_fragment:ox,uv_pars_fragment:lx,uv_pars_vertex:cx,uv_vertex:ux,worldpos_vertex:fx,background_vert:hx,background_frag:dx,backgroundCube_vert:px,backgroundCube_frag:mx,cube_vert:gx,cube_frag:xx,depth_vert:_x,depth_frag:yx,distanceRGBA_vert:vx,distanceRGBA_frag:Sx,equirect_vert:Mx,equirect_frag:bx,linedashed_vert:wx,linedashed_frag:Ex,meshbasic_vert:Tx,meshbasic_frag:Ax,meshlambert_vert:Cx,meshlambert_frag:Rx,meshmatcap_vert:Px,meshmatcap_frag:Ix,meshnormal_vert:Lx,meshnormal_frag:Dx,meshphong_vert:Ux,meshphong_frag:Nx,meshphysical_vert:Ox,meshphysical_frag:Fx,meshtoon_vert:Bx,meshtoon_frag:kx,points_vert:zx,points_frag:Hx,shadow_vert:Vx,shadow_frag:Gx,sprite_vert:Wx,sprite_frag:Xx},ie={common:{diffuse:{value:new ze(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new Ne},alphaMap:{value:null},alphaMapTransform:{value:new Ne},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new Ne}},envmap:{envMap:{value:null},envMapRotation:{value:new Ne},flipEnvMap:{value:-1},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new Ne}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new Ne}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new Ne},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new Ne},normalScale:{value:new we(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new Ne},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new Ne}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new Ne}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new Ne}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new ze(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMap:{value:[]},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotShadowMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMap:{value:[]},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null}},points:{diffuse:{value:new ze(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new Ne},alphaTest:{value:0},uvTransform:{value:new Ne}},sprite:{diffuse:{value:new ze(16777215)},opacity:{value:1},center:{value:new we(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new Ne},alphaMap:{value:null},alphaMapTransform:{value:new Ne},alphaTest:{value:0}}},pn={basic:{uniforms:Lt([ie.common,ie.specularmap,ie.envmap,ie.aomap,ie.lightmap,ie.fog]),vertexShader:Fe.meshbasic_vert,fragmentShader:Fe.meshbasic_frag},lambert:{uniforms:Lt([ie.common,ie.specularmap,ie.envmap,ie.aomap,ie.lightmap,ie.emissivemap,ie.bumpmap,ie.normalmap,ie.displacementmap,ie.fog,ie.lights,{emissive:{value:new ze(0)}}]),vertexShader:Fe.meshlambert_vert,fragmentShader:Fe.meshlambert_frag},phong:{uniforms:Lt([ie.common,ie.specularmap,ie.envmap,ie.aomap,ie.lightmap,ie.emissivemap,ie.bumpmap,ie.normalmap,ie.displacementmap,ie.fog,ie.lights,{emissive:{value:new ze(0)},specular:{value:new ze(1118481)},shininess:{value:30}}]),vertexShader:Fe.meshphong_vert,fragmentShader:Fe.meshphong_frag},standard:{uniforms:Lt([ie.common,ie.envmap,ie.aomap,ie.lightmap,ie.emissivemap,ie.bumpmap,ie.normalmap,ie.displacementmap,ie.roughnessmap,ie.metalnessmap,ie.fog,ie.lights,{emissive:{value:new ze(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:Fe.meshphysical_vert,fragmentShader:Fe.meshphysical_frag},toon:{uniforms:Lt([ie.common,ie.aomap,ie.lightmap,ie.emissivemap,ie.bumpmap,ie.normalmap,ie.displacementmap,ie.gradientmap,ie.fog,ie.lights,{emissive:{value:new ze(0)}}]),vertexShader:Fe.meshtoon_vert,fragmentShader:Fe.meshtoon_frag},matcap:{uniforms:Lt([ie.common,ie.bumpmap,ie.normalmap,ie.displacementmap,ie.fog,{matcap:{value:null}}]),vertexShader:Fe.meshmatcap_vert,fragmentShader:Fe.meshmatcap_frag},points:{uniforms:Lt([ie.points,ie.fog]),vertexShader:Fe.points_vert,fragmentShader:Fe.points_frag},dashed:{uniforms:Lt([ie.common,ie.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:Fe.linedashed_vert,fragmentShader:Fe.linedashed_frag},depth:{uniforms:Lt([ie.common,ie.displacementmap]),vertexShader:Fe.depth_vert,fragmentShader:Fe.depth_frag},normal:{uniforms:Lt([ie.common,ie.bumpmap,ie.normalmap,ie.displacementmap,{opacity:{value:1}}]),vertexShader:Fe.meshnormal_vert,fragmentShader:Fe.meshnormal_frag},sprite:{uniforms:Lt([ie.sprite,ie.fog]),vertexShader:Fe.sprite_vert,fragmentShader:Fe.sprite_frag},background:{uniforms:{uvTransform:{value:new Ne},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:Fe.background_vert,fragmentShader:Fe.background_frag},backgroundCube:{uniforms:{envMap:{value:null},flipEnvMap:{value:-1},backgroundBlurriness:{value:0},backgroundIntensity:{value:1},backgroundRotation:{value:new Ne}},vertexShader:Fe.backgroundCube_vert,fragmentShader:Fe.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:Fe.cube_vert,fragmentShader:Fe.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:Fe.equirect_vert,fragmentShader:Fe.equirect_frag},distanceRGBA:{uniforms:Lt([ie.common,ie.displacementmap,{referencePosition:{value:new O},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:Fe.distanceRGBA_vert,fragmentShader:Fe.distanceRGBA_frag},shadow:{uniforms:Lt([ie.lights,ie.fog,{color:{value:new ze(0)},opacity:{value:1}}]),vertexShader:Fe.shadow_vert,fragmentShader:Fe.shadow_frag}};pn.physical={uniforms:Lt([pn.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new Ne},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new Ne},clearcoatNormalScale:{value:new we(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new Ne},dispersion:{value:0},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new Ne},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new Ne},sheen:{value:0},sheenColor:{value:new ze(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new Ne},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new Ne},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new Ne},transmissionSamplerSize:{value:new we},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new Ne},attenuationDistance:{value:0},attenuationColor:{value:new ze(0)},specularColor:{value:new ze(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new Ne},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new Ne},anisotropyVector:{value:new we},anisotropyMap:{value:null},anisotropyMapTransform:{value:new Ne}}]),vertexShader:Fe.meshphysical_vert,fragmentShader:Fe.meshphysical_frag};var Os={r:0,b:0,g:0},ui=new Zt,qx=new dt;function Yx(i,e,t,n,r,s,a){let o=new ze(0),l=s===!0?0:1,c,u,f=null,d=0,p=null;function g(T){let w=T.isScene===!0?T.background:null;return w&&w.isTexture&&(w=(T.backgroundBlurriness>0?t:e).get(w)),w}function _(T){let w=!1,M=g(T);M===null?h(o,l):M&&M.isColor&&(h(M,1),w=!0);let N=i.xr.getEnvironmentBlendMode();N==="additive"?n.buffers.color.setClear(0,0,0,1,a):N==="alpha-blend"&&n.buffers.color.setClear(0,0,0,0,a),(i.autoClear||w)&&(n.buffers.depth.setTest(!0),n.buffers.depth.setMask(!0),n.buffers.color.setMask(!0),i.clear(i.autoClearColor,i.autoClearDepth,i.autoClearStencil))}function m(T,w){let M=g(w);M&&(M.isCubeTexture||M.mapping===ma)?(u===void 0&&(u=new Qe(new Kt(1,1,1),new xn({name:"BackgroundCubeMaterial",uniforms:fr(pn.backgroundCube.uniforms),vertexShader:pn.backgroundCube.vertexShader,fragmentShader:pn.backgroundCube.fragmentShader,side:Ot,depthTest:!1,depthWrite:!1,fog:!1})),u.geometry.deleteAttribute("normal"),u.geometry.deleteAttribute("uv"),u.onBeforeRender=function(N,A,C){this.matrixWorld.copyPosition(C.matrixWorld)},Object.defineProperty(u.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),r.update(u)),ui.copy(w.backgroundRotation),ui.x*=-1,ui.y*=-1,ui.z*=-1,M.isCubeTexture&&M.isRenderTargetTexture===!1&&(ui.y*=-1,ui.z*=-1),u.material.uniforms.envMap.value=M,u.material.uniforms.flipEnvMap.value=M.isCubeTexture&&M.isRenderTargetTexture===!1?-1:1,u.material.uniforms.backgroundBlurriness.value=w.backgroundBlurriness,u.material.uniforms.backgroundIntensity.value=w.backgroundIntensity,u.material.uniforms.backgroundRotation.value.setFromMatrix4(qx.makeRotationFromEuler(ui)),u.material.toneMapped=Ye.getTransfer(M.colorSpace)!==je,(f!==M||d!==M.version||p!==i.toneMapping)&&(u.material.needsUpdate=!0,f=M,d=M.version,p=i.toneMapping),u.layers.enableAll(),T.unshift(u,u.geometry,u.material,0,0,null)):M&&M.isTexture&&(c===void 0&&(c=new Qe(new hr(2,2),new xn({name:"BackgroundMaterial",uniforms:fr(pn.background.uniforms),vertexShader:pn.background.vertexShader,fragmentShader:pn.background.fragmentShader,side:ei,depthTest:!1,depthWrite:!1,fog:!1})),c.geometry.deleteAttribute("normal"),Object.defineProperty(c.material,"map",{get:function(){return this.uniforms.t2D.value}}),r.update(c)),c.material.uniforms.t2D.value=M,c.material.uniforms.backgroundIntensity.value=w.backgroundIntensity,c.material.toneMapped=Ye.getTransfer(M.colorSpace)!==je,M.matrixAutoUpdate===!0&&M.updateMatrix(),c.material.uniforms.uvTransform.value.copy(M.matrix),(f!==M||d!==M.version||p!==i.toneMapping)&&(c.material.needsUpdate=!0,f=M,d=M.version,p=i.toneMapping),c.layers.enableAll(),T.unshift(c,c.geometry,c.material,0,0,null))}function h(T,w){T.getRGB(Os,xh(i)),n.buffers.color.setClear(Os.r,Os.g,Os.b,w,a)}return{getClearColor:function(){return o},setClearColor:function(T,w=1){o.set(T),l=w,h(o,l)},getClearAlpha:function(){return l},setClearAlpha:function(T){l=T,h(o,l)},render:_,addToRenderList:m}}function $x(i,e){let t=i.getParameter(i.MAX_VERTEX_ATTRIBS),n={},r=d(null),s=r,a=!1;function o(S,R,V,z,X){let J=!1,q=f(z,V,R);s!==q&&(s=q,c(s.object)),J=p(S,z,V,X),J&&g(S,z,V,X),X!==null&&e.update(X,i.ELEMENT_ARRAY_BUFFER),(J||a)&&(a=!1,M(S,R,V,z),X!==null&&i.bindBuffer(i.ELEMENT_ARRAY_BUFFER,e.get(X).buffer))}function l(){return i.createVertexArray()}function c(S){return i.bindVertexArray(S)}function u(S){return i.deleteVertexArray(S)}function f(S,R,V){let z=V.wireframe===!0,X=n[S.id];X===void 0&&(X={},n[S.id]=X);let J=X[R.id];J===void 0&&(J={},X[R.id]=J);let q=J[z];return q===void 0&&(q=d(l()),J[z]=q),q}function d(S){let R=[],V=[],z=[];for(let X=0;X<t;X++)R[X]=0,V[X]=0,z[X]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:R,enabledAttributes:V,attributeDivisors:z,object:S,attributes:{},index:null}}function p(S,R,V,z){let X=s.attributes,J=R.attributes,q=0,te=V.getAttributes();for(let W in te)if(te[W].location>=0){let fe=X[W],Me=J[W];if(Me===void 0&&(W==="instanceMatrix"&&S.instanceMatrix&&(Me=S.instanceMatrix),W==="instanceColor"&&S.instanceColor&&(Me=S.instanceColor)),fe===void 0||fe.attribute!==Me||Me&&fe.data!==Me.data)return!0;q++}return s.attributesNum!==q||s.index!==z}function g(S,R,V,z){let X={},J=R.attributes,q=0,te=V.getAttributes();for(let W in te)if(te[W].location>=0){let fe=J[W];fe===void 0&&(W==="instanceMatrix"&&S.instanceMatrix&&(fe=S.instanceMatrix),W==="instanceColor"&&S.instanceColor&&(fe=S.instanceColor));let Me={};Me.attribute=fe,fe&&fe.data&&(Me.data=fe.data),X[W]=Me,q++}s.attributes=X,s.attributesNum=q,s.index=z}function _(){let S=s.newAttributes;for(let R=0,V=S.length;R<V;R++)S[R]=0}function m(S){h(S,0)}function h(S,R){let V=s.newAttributes,z=s.enabledAttributes,X=s.attributeDivisors;V[S]=1,z[S]===0&&(i.enableVertexAttribArray(S),z[S]=1),X[S]!==R&&(i.vertexAttribDivisor(S,R),X[S]=R)}function T(){let S=s.newAttributes,R=s.enabledAttributes;for(let V=0,z=R.length;V<z;V++)R[V]!==S[V]&&(i.disableVertexAttribArray(V),R[V]=0)}function w(S,R,V,z,X,J,q){q===!0?i.vertexAttribIPointer(S,R,V,X,J):i.vertexAttribPointer(S,R,V,z,X,J)}function M(S,R,V,z){_();let X=z.attributes,J=V.getAttributes(),q=R.defaultAttributeValues;for(let te in J){let W=J[te];if(W.location>=0){let se=X[te];if(se===void 0&&(te==="instanceMatrix"&&S.instanceMatrix&&(se=S.instanceMatrix),te==="instanceColor"&&S.instanceColor&&(se=S.instanceColor)),se!==void 0){let fe=se.normalized,Me=se.itemSize,Be=e.get(se);if(Be===void 0)continue;let tt=Be.buffer,$=Be.type,ne=Be.bytesPerElement,_e=$===i.INT||$===i.UNSIGNED_INT||se.gpuType===Ac;if(se.isInterleavedBufferAttribute){let ae=se.data,Ce=ae.stride,Ie=se.offset;if(ae.isInstancedInterleavedBuffer){for(let ke=0;ke<W.locationSize;ke++)h(W.location+ke,ae.meshPerAttribute);S.isInstancedMesh!==!0&&z._maxInstanceCount===void 0&&(z._maxInstanceCount=ae.meshPerAttribute*ae.count)}else for(let ke=0;ke<W.locationSize;ke++)m(W.location+ke);i.bindBuffer(i.ARRAY_BUFFER,tt);for(let ke=0;ke<W.locationSize;ke++)w(W.location+ke,Me/W.locationSize,$,fe,Ce*ne,(Ie+Me/W.locationSize*ke)*ne,_e)}else{if(se.isInstancedBufferAttribute){for(let ae=0;ae<W.locationSize;ae++)h(W.location+ae,se.meshPerAttribute);S.isInstancedMesh!==!0&&z._maxInstanceCount===void 0&&(z._maxInstanceCount=se.meshPerAttribute*se.count)}else for(let ae=0;ae<W.locationSize;ae++)m(W.location+ae);i.bindBuffer(i.ARRAY_BUFFER,tt);for(let ae=0;ae<W.locationSize;ae++)w(W.location+ae,Me/W.locationSize,$,fe,Me*ne,Me/W.locationSize*ae*ne,_e)}}else if(q!==void 0){let fe=q[te];if(fe!==void 0)switch(fe.length){case 2:i.vertexAttrib2fv(W.location,fe);break;case 3:i.vertexAttrib3fv(W.location,fe);break;case 4:i.vertexAttrib4fv(W.location,fe);break;default:i.vertexAttrib1fv(W.location,fe)}}}}T()}function N(){D();for(let S in n){let R=n[S];for(let V in R){let z=R[V];for(let X in z)u(z[X].object),delete z[X];delete R[V]}delete n[S]}}function A(S){if(n[S.id]===void 0)return;let R=n[S.id];for(let V in R){let z=R[V];for(let X in z)u(z[X].object),delete z[X];delete R[V]}delete n[S.id]}function C(S){for(let R in n){let V=n[R];if(V[S.id]===void 0)continue;let z=V[S.id];for(let X in z)u(z[X].object),delete z[X];delete V[S.id]}}function D(){b(),a=!0,s!==r&&(s=r,c(s.object))}function b(){r.geometry=null,r.program=null,r.wireframe=!1}return{setup:o,reset:D,resetDefaultState:b,dispose:N,releaseStatesOfGeometry:A,releaseStatesOfProgram:C,initAttributes:_,enableAttribute:m,disableUnusedAttributes:T}}function Zx(i,e,t){let n;function r(c){n=c}function s(c,u){i.drawArrays(n,c,u),t.update(u,n,1)}function a(c,u,f){f!==0&&(i.drawArraysInstanced(n,c,u,f),t.update(u,n,f))}function o(c,u,f){if(f===0)return;e.get("WEBGL_multi_draw").multiDrawArraysWEBGL(n,c,0,u,0,f);let p=0;for(let g=0;g<f;g++)p+=u[g];t.update(p,n,1)}function l(c,u,f,d){if(f===0)return;let p=e.get("WEBGL_multi_draw");if(p===null)for(let g=0;g<c.length;g++)a(c[g],u[g],d[g]);else{p.multiDrawArraysInstancedWEBGL(n,c,0,u,0,d,0,f);let g=0;for(let _=0;_<f;_++)g+=u[_]*d[_];t.update(g,n,1)}}this.setMode=r,this.render=s,this.renderInstances=a,this.renderMultiDraw=o,this.renderMultiDrawInstances=l}function Kx(i,e,t,n){let r;function s(){if(r!==void 0)return r;if(e.has("EXT_texture_filter_anisotropic")===!0){let C=e.get("EXT_texture_filter_anisotropic");r=i.getParameter(C.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else r=0;return r}function a(C){return!(C!==an&&n.convert(C)!==i.getParameter(i.IMPLEMENTATION_COLOR_READ_FORMAT))}function o(C){let D=C===$r&&(e.has("EXT_color_buffer_half_float")||e.has("EXT_color_buffer_float"));return!(C!==Nn&&n.convert(C)!==i.getParameter(i.IMPLEMENTATION_COLOR_READ_TYPE)&&C!==Ln&&!D)}function l(C){if(C==="highp"){if(i.getShaderPrecisionFormat(i.VERTEX_SHADER,i.HIGH_FLOAT).precision>0&&i.getShaderPrecisionFormat(i.FRAGMENT_SHADER,i.HIGH_FLOAT).precision>0)return"highp";C="mediump"}return C==="mediump"&&i.getShaderPrecisionFormat(i.VERTEX_SHADER,i.MEDIUM_FLOAT).precision>0&&i.getShaderPrecisionFormat(i.FRAGMENT_SHADER,i.MEDIUM_FLOAT).precision>0?"mediump":"lowp"}let c=t.precision!==void 0?t.precision:"highp",u=l(c);u!==c&&(console.warn("THREE.WebGLRenderer:",c,"not supported, using",u,"instead."),c=u);let f=t.logarithmicDepthBuffer===!0,d=t.reverseDepthBuffer===!0&&e.has("EXT_clip_control"),p=i.getParameter(i.MAX_TEXTURE_IMAGE_UNITS),g=i.getParameter(i.MAX_VERTEX_TEXTURE_IMAGE_UNITS),_=i.getParameter(i.MAX_TEXTURE_SIZE),m=i.getParameter(i.MAX_CUBE_MAP_TEXTURE_SIZE),h=i.getParameter(i.MAX_VERTEX_ATTRIBS),T=i.getParameter(i.MAX_VERTEX_UNIFORM_VECTORS),w=i.getParameter(i.MAX_VARYING_VECTORS),M=i.getParameter(i.MAX_FRAGMENT_UNIFORM_VECTORS),N=g>0,A=i.getParameter(i.MAX_SAMPLES);return{isWebGL2:!0,getMaxAnisotropy:s,getMaxPrecision:l,textureFormatReadable:a,textureTypeReadable:o,precision:c,logarithmicDepthBuffer:f,reverseDepthBuffer:d,maxTextures:p,maxVertexTextures:g,maxTextureSize:_,maxCubemapSize:m,maxAttributes:h,maxVertexUniforms:T,maxVaryings:w,maxFragmentUniforms:M,vertexTextures:N,maxSamples:A}}function Jx(i){let e=this,t=null,n=0,r=!1,s=!1,a=new sn,o=new Ne,l={value:null,needsUpdate:!1};this.uniform=l,this.numPlanes=0,this.numIntersection=0,this.init=function(f,d){let p=f.length!==0||d||n!==0||r;return r=d,n=f.length,p},this.beginShadows=function(){s=!0,u(null)},this.endShadows=function(){s=!1},this.setGlobalState=function(f,d){t=u(f,d,0)},this.setState=function(f,d,p){let g=f.clippingPlanes,_=f.clipIntersection,m=f.clipShadows,h=i.get(f);if(!r||g===null||g.length===0||s&&!m)s?u(null):c();else{let T=s?0:n,w=T*4,M=h.clippingState||null;l.value=M,M=u(g,d,w,p);for(let N=0;N!==w;++N)M[N]=t[N];h.clippingState=M,this.numIntersection=_?this.numPlanes:0,this.numPlanes+=T}};function c(){l.value!==t&&(l.value=t,l.needsUpdate=n>0),e.numPlanes=n,e.numIntersection=0}function u(f,d,p,g){let _=f!==null?f.length:0,m=null;if(_!==0){if(m=l.value,g!==!0||m===null){let h=p+_*4,T=d.matrixWorldInverse;o.getNormalMatrix(T),(m===null||m.length<h)&&(m=new Float32Array(h));for(let w=0,M=p;w!==_;++w,M+=4)a.copy(f[w]).applyMatrix4(T,o),a.normal.toArray(m,M),m[M+3]=a.constant}l.value=m,l.needsUpdate=!0}return e.numPlanes=_,e.numIntersection=0,m}}function jx(i){let e=new WeakMap;function t(a,o){return o===yl?a.mapping=ar:o===vl&&(a.mapping=or),a}function n(a){if(a&&a.isTexture){let o=a.mapping;if(o===yl||o===vl)if(e.has(a)){let l=e.get(a).texture;return t(l,a.mapping)}else{let l=a.image;if(l&&l.height>0){let c=new ec(l.height);return c.fromEquirectangularTexture(i,a),e.set(a,c),a.addEventListener("dispose",r),t(c.texture,a.mapping)}else return null}}return a}function r(a){let o=a.target;o.removeEventListener("dispose",r);let l=e.get(o);l!==void 0&&(e.delete(o),l.dispose())}function s(){e=new WeakMap}return{get:n,dispose:s}}var ta=class extends Qs{constructor(e=-1,t=1,n=1,r=-1,s=.1,a=2e3){super(),this.isOrthographicCamera=!0,this.type="OrthographicCamera",this.zoom=1,this.view=null,this.left=e,this.right=t,this.top=n,this.bottom=r,this.near=s,this.far=a,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.left=e.left,this.right=e.right,this.top=e.top,this.bottom=e.bottom,this.near=e.near,this.far=e.far,this.zoom=e.zoom,this.view=e.view===null?null:Object.assign({},e.view),this}setViewOffset(e,t,n,r,s,a){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=n,this.view.offsetY=r,this.view.width=s,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let e=(this.right-this.left)/(2*this.zoom),t=(this.top-this.bottom)/(2*this.zoom),n=(this.right+this.left)/2,r=(this.top+this.bottom)/2,s=n-e,a=n+e,o=r+t,l=r-t;if(this.view!==null&&this.view.enabled){let c=(this.right-this.left)/this.view.fullWidth/this.zoom,u=(this.top-this.bottom)/this.view.fullHeight/this.zoom;s+=c*this.view.offsetX,a=s+c*this.view.width,o-=u*this.view.offsetY,l=o-u*this.view.height}this.projectionMatrix.makeOrthographic(s,a,o,l,this.near,this.far,this.coordinateSystem),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){let t=super.toJSON(e);return t.object.zoom=this.zoom,t.object.left=this.left,t.object.right=this.right,t.object.top=this.top,t.object.bottom=this.bottom,t.object.near=this.near,t.object.far=this.far,this.view!==null&&(t.object.view=Object.assign({},this.view)),t}},er=4,wf=[.125,.215,.35,.446,.526,.582],mi=20,il=new ta,Ef=new ze,rl=null,sl=0,al=0,ol=!1,hi=(1+Math.sqrt(5))/2,ji=1/hi,Tf=[new O(-hi,ji,0),new O(hi,ji,0),new O(-ji,0,hi),new O(ji,0,hi),new O(0,hi,-ji),new O(0,hi,ji),new O(-1,1,-1),new O(1,1,-1),new O(-1,1,1),new O(1,1,1)],na=class{constructor(e){this._renderer=e,this._pingPongRenderTarget=null,this._lodMax=0,this._cubeSize=0,this._lodPlanes=[],this._sizeLods=[],this._sigmas=[],this._blurMaterial=null,this._cubemapMaterial=null,this._equirectMaterial=null,this._compileMaterial(this._blurMaterial)}fromScene(e,t=0,n=.1,r=100){rl=this._renderer.getRenderTarget(),sl=this._renderer.getActiveCubeFace(),al=this._renderer.getActiveMipmapLevel(),ol=this._renderer.xr.enabled,this._renderer.xr.enabled=!1,this._setSize(256);let s=this._allocateTargets();return s.depthBuffer=!0,this._sceneToCubeUV(e,n,r,s),t>0&&this._blur(s,0,0,t),this._applyPMREM(s),this._cleanup(s),s}fromEquirectangular(e,t=null){return this._fromTexture(e,t)}fromCubemap(e,t=null){return this._fromTexture(e,t)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=Rf(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=Cf(),this._compileMaterial(this._equirectMaterial))}dispose(){this._dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose()}_setSize(e){this._lodMax=Math.floor(Math.log2(e)),this._cubeSize=Math.pow(2,this._lodMax)}_dispose(){this._blurMaterial!==null&&this._blurMaterial.dispose(),this._pingPongRenderTarget!==null&&this._pingPongRenderTarget.dispose();for(let e=0;e<this._lodPlanes.length;e++)this._lodPlanes[e].dispose()}_cleanup(e){this._renderer.setRenderTarget(rl,sl,al),this._renderer.xr.enabled=ol,e.scissorTest=!1,Fs(e,0,0,e.width,e.height)}_fromTexture(e,t){e.mapping===ar||e.mapping===or?this._setSize(e.image.length===0?16:e.image[0].width||e.image[0].image.width):this._setSize(e.image.width/4),rl=this._renderer.getRenderTarget(),sl=this._renderer.getActiveCubeFace(),al=this._renderer.getActiveMipmapLevel(),ol=this._renderer.xr.enabled,this._renderer.xr.enabled=!1;let n=t||this._allocateTargets();return this._textureToCubeUV(e,n),this._applyPMREM(n),this._cleanup(n),n}_allocateTargets(){let e=3*Math.max(this._cubeSize,112),t=4*this._cubeSize,n={magFilter:mn,minFilter:mn,generateMipmaps:!1,type:$r,format:an,colorSpace:mr,depthBuffer:!1},r=Af(e,t,n);if(this._pingPongRenderTarget===null||this._pingPongRenderTarget.width!==e||this._pingPongRenderTarget.height!==t){this._pingPongRenderTarget!==null&&this._dispose(),this._pingPongRenderTarget=Af(e,t,n);let{_lodMax:s}=this;({sizeLods:this._sizeLods,lodPlanes:this._lodPlanes,sigmas:this._sigmas}=Qx(s)),this._blurMaterial=e0(s,e,t)}return r}_compileMaterial(e){let t=new Qe(this._lodPlanes[0],e);this._renderer.compile(t,il)}_sceneToCubeUV(e,t,n,r){let o=new Dt(90,1,t,n),l=[1,-1,1,1,1,1],c=[1,1,1,-1,-1,-1],u=this._renderer,f=u.autoClear,d=u.toneMapping;u.getClearColor(Ef),u.toneMapping=Qn,u.autoClear=!1;let p=new Ks({name:"PMREM.Background",side:Ot,depthWrite:!1,depthTest:!1}),g=new Qe(new Kt,p),_=!1,m=e.background;m?m.isColor&&(p.color.copy(m),e.background=null,_=!0):(p.color.copy(Ef),_=!0);for(let h=0;h<6;h++){let T=h%3;T===0?(o.up.set(0,l[h],0),o.lookAt(c[h],0,0)):T===1?(o.up.set(0,0,l[h]),o.lookAt(0,c[h],0)):(o.up.set(0,l[h],0),o.lookAt(0,0,c[h]));let w=this._cubeSize;Fs(r,T*w,h>2?w:0,w,w),u.setRenderTarget(r),_&&u.render(g,o),u.render(e,o)}g.geometry.dispose(),g.material.dispose(),u.toneMapping=d,u.autoClear=f,e.background=m}_textureToCubeUV(e,t){let n=this._renderer,r=e.mapping===ar||e.mapping===or;r?(this._cubemapMaterial===null&&(this._cubemapMaterial=Rf()),this._cubemapMaterial.uniforms.flipEnvMap.value=e.isRenderTargetTexture===!1?-1:1):this._equirectMaterial===null&&(this._equirectMaterial=Cf());let s=r?this._cubemapMaterial:this._equirectMaterial,a=new Qe(this._lodPlanes[0],s),o=s.uniforms;o.envMap.value=e;let l=this._cubeSize;Fs(t,0,0,3*l,2*l),n.setRenderTarget(t),n.render(a,il)}_applyPMREM(e){let t=this._renderer,n=t.autoClear;t.autoClear=!1;let r=this._lodPlanes.length;for(let s=1;s<r;s++){let a=Math.sqrt(this._sigmas[s]*this._sigmas[s]-this._sigmas[s-1]*this._sigmas[s-1]),o=Tf[(r-s-1)%Tf.length];this._blur(e,s-1,s,a,o)}t.autoClear=n}_blur(e,t,n,r,s){let a=this._pingPongRenderTarget;this._halfBlur(e,a,t,n,r,"latitudinal",s),this._halfBlur(a,e,n,n,r,"longitudinal",s)}_halfBlur(e,t,n,r,s,a,o){let l=this._renderer,c=this._blurMaterial;a!=="latitudinal"&&a!=="longitudinal"&&console.error("blur direction must be either latitudinal or longitudinal!");let u=3,f=new Qe(this._lodPlanes[r],c),d=c.uniforms,p=this._sizeLods[n]-1,g=isFinite(s)?Math.PI/(2*p):2*Math.PI/(2*mi-1),_=s/g,m=isFinite(s)?1+Math.floor(u*_):mi;m>mi&&console.warn(`sigmaRadians, ${s}, is too large and will clip, as it requested ${m} samples when the maximum is set to ${mi}`);let h=[],T=0;for(let C=0;C<mi;++C){let D=C/_,b=Math.exp(-D*D/2);h.push(b),C===0?T+=b:C<m&&(T+=2*b)}for(let C=0;C<h.length;C++)h[C]=h[C]/T;d.envMap.value=e.texture,d.samples.value=m,d.weights.value=h,d.latitudinal.value=a==="latitudinal",o&&(d.poleAxis.value=o);let{_lodMax:w}=this;d.dTheta.value=g,d.mipInt.value=w-n;let M=this._sizeLods[r],N=3*M*(r>w-er?r-w+er:0),A=4*(this._cubeSize-M);Fs(t,N,A,3*M,2*M),l.setRenderTarget(t),l.render(f,il)}};function Qx(i){let e=[],t=[],n=[],r=i,s=i-er+1+wf.length;for(let a=0;a<s;a++){let o=Math.pow(2,r);t.push(o);let l=1/o;a>i-er?l=wf[a-i+er-1]:a===0&&(l=0),n.push(l);let c=1/(o-2),u=-c,f=1+c,d=[u,u,f,u,f,f,u,u,f,f,u,f],p=6,g=6,_=3,m=2,h=1,T=new Float32Array(_*g*p),w=new Float32Array(m*g*p),M=new Float32Array(h*g*p);for(let A=0;A<p;A++){let C=A%3*2/3-1,D=A>2?0:-1,b=[C,D,0,C+2/3,D,0,C+2/3,D+1,0,C,D,0,C+2/3,D+1,0,C,D+1,0];T.set(b,_*g*A),w.set(d,m*g*A);let S=[A,A,A,A,A,A];M.set(S,h*g*A)}let N=new cn;N.setAttribute("position",new $t(T,_)),N.setAttribute("uv",new $t(w,m)),N.setAttribute("faceIndex",new $t(M,h)),e.push(N),r>er&&r--}return{lodPlanes:e,sizeLods:t,sigmas:n}}function Af(i,e,t){let n=new Fn(i,e,t);return n.texture.mapping=ma,n.texture.name="PMREM.cubeUv",n.scissorTest=!0,n}function Fs(i,e,t,n,r){i.viewport.set(e,t,n,r),i.scissor.set(e,t,n,r)}function e0(i,e,t){let n=new Float32Array(mi),r=new O(0,1,0);return new xn({name:"SphericalGaussianBlur",defines:{n:mi,CUBEUV_TEXEL_WIDTH:1/e,CUBEUV_TEXEL_HEIGHT:1/t,CUBEUV_MAX_MIP:`${i}.0`},uniforms:{envMap:{value:null},samples:{value:1},weights:{value:n},latitudinal:{value:!1},dTheta:{value:0},mipInt:{value:0},poleAxis:{value:r}},vertexShader:Uc(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;
			uniform int samples;
			uniform float weights[ n ];
			uniform bool latitudinal;
			uniform float dTheta;
			uniform float mipInt;
			uniform vec3 poleAxis;

			#define ENVMAP_TYPE_CUBE_UV
			#include <cube_uv_reflection_fragment>

			vec3 getSample( float theta, vec3 axis ) {

				float cosTheta = cos( theta );
				// Rodrigues' axis-angle rotation
				vec3 sampleDirection = vOutputDirection * cosTheta
					+ cross( axis, vOutputDirection ) * sin( theta )
					+ axis * dot( axis, vOutputDirection ) * ( 1.0 - cosTheta );

				return bilinearCubeUV( envMap, sampleDirection, mipInt );

			}

			void main() {

				vec3 axis = latitudinal ? poleAxis : cross( poleAxis, vOutputDirection );

				if ( all( equal( axis, vec3( 0.0 ) ) ) ) {

					axis = vec3( vOutputDirection.z, 0.0, - vOutputDirection.x );

				}

				axis = normalize( axis );

				gl_FragColor = vec4( 0.0, 0.0, 0.0, 1.0 );
				gl_FragColor.rgb += weights[ 0 ] * getSample( 0.0, axis );

				for ( int i = 1; i < n; i++ ) {

					if ( i >= samples ) {

						break;

					}

					float theta = dTheta * float( i );
					gl_FragColor.rgb += weights[ i ] * getSample( -1.0 * theta, axis );
					gl_FragColor.rgb += weights[ i ] * getSample( theta, axis );

				}

			}
		`,blending:jn,depthTest:!1,depthWrite:!1})}function Cf(){return new xn({name:"EquirectangularToCubeUV",uniforms:{envMap:{value:null}},vertexShader:Uc(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;

			#include <common>

			void main() {

				vec3 outputDirection = normalize( vOutputDirection );
				vec2 uv = equirectUv( outputDirection );

				gl_FragColor = vec4( texture2D ( envMap, uv ).rgb, 1.0 );

			}
		`,blending:jn,depthTest:!1,depthWrite:!1})}function Rf(){return new xn({name:"CubemapToCubeUV",uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:Uc(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			uniform float flipEnvMap;

			varying vec3 vOutputDirection;

			uniform samplerCube envMap;

			void main() {

				gl_FragColor = textureCube( envMap, vec3( flipEnvMap * vOutputDirection.x, vOutputDirection.yz ) );

			}
		`,blending:jn,depthTest:!1,depthWrite:!1})}function Uc(){return`

		precision mediump float;
		precision mediump int;

		attribute float faceIndex;

		varying vec3 vOutputDirection;

		// RH coordinate system; PMREM face-indexing convention
		vec3 getDirection( vec2 uv, float face ) {

			uv = 2.0 * uv - 1.0;

			vec3 direction = vec3( uv, 1.0 );

			if ( face == 0.0 ) {

				direction = direction.zyx; // ( 1, v, u ) pos x

			} else if ( face == 1.0 ) {

				direction = direction.xzy;
				direction.xz *= -1.0; // ( -u, 1, -v ) pos y

			} else if ( face == 2.0 ) {

				direction.x *= -1.0; // ( -u, v, 1 ) pos z

			} else if ( face == 3.0 ) {

				direction = direction.zyx;
				direction.xz *= -1.0; // ( -1, v, -u ) neg x

			} else if ( face == 4.0 ) {

				direction = direction.xzy;
				direction.xy *= -1.0; // ( -u, -1, v ) neg y

			} else if ( face == 5.0 ) {

				direction.z *= -1.0; // ( u, v, -1 ) neg z

			}

			return direction;

		}

		void main() {

			vOutputDirection = getDirection( uv, faceIndex );
			gl_Position = vec4( position, 1.0 );

		}
	`}function t0(i){let e=new WeakMap,t=null;function n(o){if(o&&o.isTexture){let l=o.mapping,c=l===yl||l===vl,u=l===ar||l===or;if(c||u){let f=e.get(o),d=f!==void 0?f.texture.pmremVersion:0;if(o.isRenderTargetTexture&&o.pmremVersion!==d)return t===null&&(t=new na(i)),f=c?t.fromEquirectangular(o,f):t.fromCubemap(o,f),f.texture.pmremVersion=o.pmremVersion,e.set(o,f),f.texture;if(f!==void 0)return f.texture;{let p=o.image;return c&&p&&p.height>0||u&&p&&r(p)?(t===null&&(t=new na(i)),f=c?t.fromEquirectangular(o):t.fromCubemap(o),f.texture.pmremVersion=o.pmremVersion,e.set(o,f),o.addEventListener("dispose",s),f.texture):null}}}return o}function r(o){let l=0,c=6;for(let u=0;u<c;u++)o[u]!==void 0&&l++;return l===c}function s(o){let l=o.target;l.removeEventListener("dispose",s);let c=e.get(l);c!==void 0&&(e.delete(l),c.dispose())}function a(){e=new WeakMap,t!==null&&(t.dispose(),t=null)}return{get:n,dispose:a}}function n0(i){let e={};function t(n){if(e[n]!==void 0)return e[n];let r;switch(n){case"WEBGL_depth_texture":r=i.getExtension("WEBGL_depth_texture")||i.getExtension("MOZ_WEBGL_depth_texture")||i.getExtension("WEBKIT_WEBGL_depth_texture");break;case"EXT_texture_filter_anisotropic":r=i.getExtension("EXT_texture_filter_anisotropic")||i.getExtension("MOZ_EXT_texture_filter_anisotropic")||i.getExtension("WEBKIT_EXT_texture_filter_anisotropic");break;case"WEBGL_compressed_texture_s3tc":r=i.getExtension("WEBGL_compressed_texture_s3tc")||i.getExtension("MOZ_WEBGL_compressed_texture_s3tc")||i.getExtension("WEBKIT_WEBGL_compressed_texture_s3tc");break;case"WEBGL_compressed_texture_pvrtc":r=i.getExtension("WEBGL_compressed_texture_pvrtc")||i.getExtension("WEBKIT_WEBGL_compressed_texture_pvrtc");break;default:r=i.getExtension(n)}return e[n]=r,r}return{has:function(n){return t(n)!==null},init:function(){t("EXT_color_buffer_float"),t("WEBGL_clip_cull_distance"),t("OES_texture_float_linear"),t("EXT_color_buffer_half_float"),t("WEBGL_multisampled_render_to_texture"),t("WEBGL_render_shared_exponent")},get:function(n){let r=t(n);return r===null&&Or("THREE.WebGLRenderer: "+n+" extension not supported."),r}}}function i0(i,e,t,n){let r={},s=new WeakMap;function a(f){let d=f.target;d.index!==null&&e.remove(d.index);for(let g in d.attributes)e.remove(d.attributes[g]);for(let g in d.morphAttributes){let _=d.morphAttributes[g];for(let m=0,h=_.length;m<h;m++)e.remove(_[m])}d.removeEventListener("dispose",a),delete r[d.id];let p=s.get(d);p&&(e.remove(p),s.delete(d)),n.releaseStatesOfGeometry(d),d.isInstancedBufferGeometry===!0&&delete d._maxInstanceCount,t.memory.geometries--}function o(f,d){return r[d.id]===!0||(d.addEventListener("dispose",a),r[d.id]=!0,t.memory.geometries++),d}function l(f){let d=f.attributes;for(let g in d)e.update(d[g],i.ARRAY_BUFFER);let p=f.morphAttributes;for(let g in p){let _=p[g];for(let m=0,h=_.length;m<h;m++)e.update(_[m],i.ARRAY_BUFFER)}}function c(f){let d=[],p=f.index,g=f.attributes.position,_=0;if(p!==null){let T=p.array;_=p.version;for(let w=0,M=T.length;w<M;w+=3){let N=T[w+0],A=T[w+1],C=T[w+2];d.push(N,A,A,C,C,N)}}else if(g!==void 0){let T=g.array;_=g.version;for(let w=0,M=T.length/3-1;w<M;w+=3){let N=w+0,A=w+1,C=w+2;d.push(N,A,A,C,C,N)}}else return;let m=new(mh(d)?js:Js)(d,1);m.version=_;let h=s.get(f);h&&e.remove(h),s.set(f,m)}function u(f){let d=s.get(f);if(d){let p=f.index;p!==null&&d.version<p.version&&c(f)}else c(f);return s.get(f)}return{get:o,update:l,getWireframeAttribute:u}}function r0(i,e,t){let n;function r(d){n=d}let s,a;function o(d){s=d.type,a=d.bytesPerElement}function l(d,p){i.drawElements(n,p,s,d*a),t.update(p,n,1)}function c(d,p,g){g!==0&&(i.drawElementsInstanced(n,p,s,d*a,g),t.update(p,n,g))}function u(d,p,g){if(g===0)return;e.get("WEBGL_multi_draw").multiDrawElementsWEBGL(n,p,0,s,d,0,g);let m=0;for(let h=0;h<g;h++)m+=p[h];t.update(m,n,1)}function f(d,p,g,_){if(g===0)return;let m=e.get("WEBGL_multi_draw");if(m===null)for(let h=0;h<d.length;h++)c(d[h]/a,p[h],_[h]);else{m.multiDrawElementsInstancedWEBGL(n,p,0,s,d,0,_,0,g);let h=0;for(let T=0;T<g;T++)h+=p[T]*_[T];t.update(h,n,1)}}this.setMode=r,this.setIndex=o,this.render=l,this.renderInstances=c,this.renderMultiDraw=u,this.renderMultiDrawInstances=f}function s0(i){let e={geometries:0,textures:0},t={frame:0,calls:0,triangles:0,points:0,lines:0};function n(s,a,o){switch(t.calls++,a){case i.TRIANGLES:t.triangles+=o*(s/3);break;case i.LINES:t.lines+=o*(s/2);break;case i.LINE_STRIP:t.lines+=o*(s-1);break;case i.LINE_LOOP:t.lines+=o*s;break;case i.POINTS:t.points+=o*s;break;default:console.error("THREE.WebGLInfo: Unknown draw mode:",a);break}}function r(){t.calls=0,t.triangles=0,t.points=0,t.lines=0}return{memory:e,render:t,programs:null,autoReset:!0,reset:r,update:n}}function a0(i,e,t){let n=new WeakMap,r=new ht;function s(a,o,l){let c=a.morphTargetInfluences,u=o.morphAttributes.position||o.morphAttributes.normal||o.morphAttributes.color,f=u!==void 0?u.length:0,d=n.get(o);if(d===void 0||d.count!==f){let b=function(){C.dispose(),n.delete(o),o.removeEventListener("dispose",b)};d!==void 0&&d.texture.dispose();let p=o.morphAttributes.position!==void 0,g=o.morphAttributes.normal!==void 0,_=o.morphAttributes.color!==void 0,m=o.morphAttributes.position||[],h=o.morphAttributes.normal||[],T=o.morphAttributes.color||[],w=0;p===!0&&(w=1),g===!0&&(w=2),_===!0&&(w=3);let M=o.attributes.position.count*w,N=1;M>e.maxTextureSize&&(N=Math.ceil(M/e.maxTextureSize),M=e.maxTextureSize);let A=new Float32Array(M*N*4*f),C=new Zs(A,M,N,f);C.type=Ln,C.needsUpdate=!0;let D=w*4;for(let S=0;S<f;S++){let R=m[S],V=h[S],z=T[S],X=M*N*4*S;for(let J=0;J<R.count;J++){let q=J*D;p===!0&&(r.fromBufferAttribute(R,J),A[X+q+0]=r.x,A[X+q+1]=r.y,A[X+q+2]=r.z,A[X+q+3]=0),g===!0&&(r.fromBufferAttribute(V,J),A[X+q+4]=r.x,A[X+q+5]=r.y,A[X+q+6]=r.z,A[X+q+7]=0),_===!0&&(r.fromBufferAttribute(z,J),A[X+q+8]=r.x,A[X+q+9]=r.y,A[X+q+10]=r.z,A[X+q+11]=z.itemSize===4?r.w:1)}}d={count:f,texture:C,size:new we(M,N)},n.set(o,d),o.addEventListener("dispose",b)}if(a.isInstancedMesh===!0&&a.morphTexture!==null)l.getUniforms().setValue(i,"morphTexture",a.morphTexture,t);else{let p=0;for(let _=0;_<c.length;_++)p+=c[_];let g=o.morphTargetsRelative?1:1-p;l.getUniforms().setValue(i,"morphTargetBaseInfluence",g),l.getUniforms().setValue(i,"morphTargetInfluences",c)}l.getUniforms().setValue(i,"morphTargetsTexture",d.texture,t),l.getUniforms().setValue(i,"morphTargetsTextureSize",d.size)}return{update:s}}function o0(i,e,t,n){let r=new WeakMap;function s(l){let c=n.render.frame,u=l.geometry,f=e.get(l,u);if(r.get(f)!==c&&(e.update(f),r.set(f,c)),l.isInstancedMesh&&(l.hasEventListener("dispose",o)===!1&&l.addEventListener("dispose",o),r.get(l)!==c&&(t.update(l.instanceMatrix,i.ARRAY_BUFFER),l.instanceColor!==null&&t.update(l.instanceColor,i.ARRAY_BUFFER),r.set(l,c))),l.isSkinnedMesh){let d=l.skeleton;r.get(d)!==c&&(d.update(),r.set(d,c))}return f}function a(){r=new WeakMap}function o(l){let c=l.target;c.removeEventListener("dispose",o),t.remove(c.instanceMatrix),c.instanceColor!==null&&t.remove(c.instanceColor)}return{update:s,dispose:a}}var ia=class extends Gt{constructor(e,t,n,r,s,a,o,l,c,u=nr){if(u!==nr&&u!==cr)throw new Error("DepthTexture format must be either THREE.DepthFormat or THREE.DepthStencilFormat");n===void 0&&u===nr&&(n=_i),n===void 0&&u===cr&&(n=lr),super(null,r,s,a,o,l,u,n,c),this.isDepthTexture=!0,this.image={width:e,height:t},this.magFilter=o!==void 0?o:on,this.minFilter=l!==void 0?l:on,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(e){return super.copy(e),this.compareFunction=e.compareFunction,this}toJSON(e){let t=super.toJSON(e);return this.compareFunction!==null&&(t.compareFunction=this.compareFunction),t}},yh=new Gt,Pf=new ia(1,1),vh=new Zs,Sh=new jl,Mh=new ea,If=[],Lf=[],Df=new Float32Array(16),Uf=new Float32Array(9),Nf=new Float32Array(4);function xr(i,e,t){let n=i[0];if(n<=0||n>0)return i;let r=e*t,s=If[r];if(s===void 0&&(s=new Float32Array(r),If[r]=s),e!==0){n.toArray(s,0);for(let a=1,o=0;a!==e;++a)o+=t,i[a].toArray(s,o)}return s}function _t(i,e){if(i.length!==e.length)return!1;for(let t=0,n=i.length;t<n;t++)if(i[t]!==e[t])return!1;return!0}function yt(i,e){for(let t=0,n=e.length;t<n;t++)i[t]=e[t]}function xa(i,e){let t=Lf[e];t===void 0&&(t=new Int32Array(e),Lf[e]=t);for(let n=0;n!==e;++n)t[n]=i.allocateTextureUnit();return t}function l0(i,e){let t=this.cache;t[0]!==e&&(i.uniform1f(this.addr,e),t[0]=e)}function c0(i,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(i.uniform2f(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(_t(t,e))return;i.uniform2fv(this.addr,e),yt(t,e)}}function u0(i,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(i.uniform3f(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else if(e.r!==void 0)(t[0]!==e.r||t[1]!==e.g||t[2]!==e.b)&&(i.uniform3f(this.addr,e.r,e.g,e.b),t[0]=e.r,t[1]=e.g,t[2]=e.b);else{if(_t(t,e))return;i.uniform3fv(this.addr,e),yt(t,e)}}function f0(i,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(i.uniform4f(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(_t(t,e))return;i.uniform4fv(this.addr,e),yt(t,e)}}function h0(i,e){let t=this.cache,n=e.elements;if(n===void 0){if(_t(t,e))return;i.uniformMatrix2fv(this.addr,!1,e),yt(t,e)}else{if(_t(t,n))return;Nf.set(n),i.uniformMatrix2fv(this.addr,!1,Nf),yt(t,n)}}function d0(i,e){let t=this.cache,n=e.elements;if(n===void 0){if(_t(t,e))return;i.uniformMatrix3fv(this.addr,!1,e),yt(t,e)}else{if(_t(t,n))return;Uf.set(n),i.uniformMatrix3fv(this.addr,!1,Uf),yt(t,n)}}function p0(i,e){let t=this.cache,n=e.elements;if(n===void 0){if(_t(t,e))return;i.uniformMatrix4fv(this.addr,!1,e),yt(t,e)}else{if(_t(t,n))return;Df.set(n),i.uniformMatrix4fv(this.addr,!1,Df),yt(t,n)}}function m0(i,e){let t=this.cache;t[0]!==e&&(i.uniform1i(this.addr,e),t[0]=e)}function g0(i,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(i.uniform2i(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(_t(t,e))return;i.uniform2iv(this.addr,e),yt(t,e)}}function x0(i,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(i.uniform3i(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else{if(_t(t,e))return;i.uniform3iv(this.addr,e),yt(t,e)}}function _0(i,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(i.uniform4i(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(_t(t,e))return;i.uniform4iv(this.addr,e),yt(t,e)}}function y0(i,e){let t=this.cache;t[0]!==e&&(i.uniform1ui(this.addr,e),t[0]=e)}function v0(i,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(i.uniform2ui(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(_t(t,e))return;i.uniform2uiv(this.addr,e),yt(t,e)}}function S0(i,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(i.uniform3ui(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else{if(_t(t,e))return;i.uniform3uiv(this.addr,e),yt(t,e)}}function M0(i,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(i.uniform4ui(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(_t(t,e))return;i.uniform4uiv(this.addr,e),yt(t,e)}}function b0(i,e,t){let n=this.cache,r=t.allocateTextureUnit();n[0]!==r&&(i.uniform1i(this.addr,r),n[0]=r);let s;this.type===i.SAMPLER_2D_SHADOW?(Pf.compareFunction=dh,s=Pf):s=yh,t.setTexture2D(e||s,r)}function w0(i,e,t){let n=this.cache,r=t.allocateTextureUnit();n[0]!==r&&(i.uniform1i(this.addr,r),n[0]=r),t.setTexture3D(e||Sh,r)}function E0(i,e,t){let n=this.cache,r=t.allocateTextureUnit();n[0]!==r&&(i.uniform1i(this.addr,r),n[0]=r),t.setTextureCube(e||Mh,r)}function T0(i,e,t){let n=this.cache,r=t.allocateTextureUnit();n[0]!==r&&(i.uniform1i(this.addr,r),n[0]=r),t.setTexture2DArray(e||vh,r)}function A0(i){switch(i){case 5126:return l0;case 35664:return c0;case 35665:return u0;case 35666:return f0;case 35674:return h0;case 35675:return d0;case 35676:return p0;case 5124:case 35670:return m0;case 35667:case 35671:return g0;case 35668:case 35672:return x0;case 35669:case 35673:return _0;case 5125:return y0;case 36294:return v0;case 36295:return S0;case 36296:return M0;case 35678:case 36198:case 36298:case 36306:case 35682:return b0;case 35679:case 36299:case 36307:return w0;case 35680:case 36300:case 36308:case 36293:return E0;case 36289:case 36303:case 36311:case 36292:return T0}}function C0(i,e){i.uniform1fv(this.addr,e)}function R0(i,e){let t=xr(e,this.size,2);i.uniform2fv(this.addr,t)}function P0(i,e){let t=xr(e,this.size,3);i.uniform3fv(this.addr,t)}function I0(i,e){let t=xr(e,this.size,4);i.uniform4fv(this.addr,t)}function L0(i,e){let t=xr(e,this.size,4);i.uniformMatrix2fv(this.addr,!1,t)}function D0(i,e){let t=xr(e,this.size,9);i.uniformMatrix3fv(this.addr,!1,t)}function U0(i,e){let t=xr(e,this.size,16);i.uniformMatrix4fv(this.addr,!1,t)}function N0(i,e){i.uniform1iv(this.addr,e)}function O0(i,e){i.uniform2iv(this.addr,e)}function F0(i,e){i.uniform3iv(this.addr,e)}function B0(i,e){i.uniform4iv(this.addr,e)}function k0(i,e){i.uniform1uiv(this.addr,e)}function z0(i,e){i.uniform2uiv(this.addr,e)}function H0(i,e){i.uniform3uiv(this.addr,e)}function V0(i,e){i.uniform4uiv(this.addr,e)}function G0(i,e,t){let n=this.cache,r=e.length,s=xa(t,r);_t(n,s)||(i.uniform1iv(this.addr,s),yt(n,s));for(let a=0;a!==r;++a)t.setTexture2D(e[a]||yh,s[a])}function W0(i,e,t){let n=this.cache,r=e.length,s=xa(t,r);_t(n,s)||(i.uniform1iv(this.addr,s),yt(n,s));for(let a=0;a!==r;++a)t.setTexture3D(e[a]||Sh,s[a])}function X0(i,e,t){let n=this.cache,r=e.length,s=xa(t,r);_t(n,s)||(i.uniform1iv(this.addr,s),yt(n,s));for(let a=0;a!==r;++a)t.setTextureCube(e[a]||Mh,s[a])}function q0(i,e,t){let n=this.cache,r=e.length,s=xa(t,r);_t(n,s)||(i.uniform1iv(this.addr,s),yt(n,s));for(let a=0;a!==r;++a)t.setTexture2DArray(e[a]||vh,s[a])}function Y0(i){switch(i){case 5126:return C0;case 35664:return R0;case 35665:return P0;case 35666:return I0;case 35674:return L0;case 35675:return D0;case 35676:return U0;case 5124:case 35670:return N0;case 35667:case 35671:return O0;case 35668:case 35672:return F0;case 35669:case 35673:return B0;case 5125:return k0;case 36294:return z0;case 36295:return H0;case 36296:return V0;case 35678:case 36198:case 36298:case 36306:case 35682:return G0;case 35679:case 36299:case 36307:return W0;case 35680:case 36300:case 36308:case 36293:return X0;case 36289:case 36303:case 36311:case 36292:return q0}}var tc=class{constructor(e,t,n){this.id=e,this.addr=n,this.cache=[],this.type=t.type,this.setValue=A0(t.type)}},nc=class{constructor(e,t,n){this.id=e,this.addr=n,this.cache=[],this.type=t.type,this.size=t.size,this.setValue=Y0(t.type)}},ic=class{constructor(e){this.id=e,this.seq=[],this.map={}}setValue(e,t,n){let r=this.seq;for(let s=0,a=r.length;s!==a;++s){let o=r[s];o.setValue(e,t[o.id],n)}}},ll=/(\w+)(\])?(\[|\.)?/g;function Of(i,e){i.seq.push(e),i.map[e.id]=e}function $0(i,e,t){let n=i.name,r=n.length;for(ll.lastIndex=0;;){let s=ll.exec(n),a=ll.lastIndex,o=s[1],l=s[2]==="]",c=s[3];if(l&&(o=o|0),c===void 0||c==="["&&a+2===r){Of(t,c===void 0?new tc(o,i,e):new nc(o,i,e));break}else{let f=t.map[o];f===void 0&&(f=new ic(o),Of(t,f)),t=f}}}var rr=class{constructor(e,t){this.seq=[],this.map={};let n=e.getProgramParameter(t,e.ACTIVE_UNIFORMS);for(let r=0;r<n;++r){let s=e.getActiveUniform(t,r),a=e.getUniformLocation(t,s.name);$0(s,a,this)}}setValue(e,t,n,r){let s=this.map[t];s!==void 0&&s.setValue(e,n,r)}setOptional(e,t,n){let r=t[n];r!==void 0&&this.setValue(e,n,r)}static upload(e,t,n,r){for(let s=0,a=t.length;s!==a;++s){let o=t[s],l=n[o.id];l.needsUpdate!==!1&&o.setValue(e,l.value,r)}}static seqWithValue(e,t){let n=[];for(let r=0,s=e.length;r!==s;++r){let a=e[r];a.id in t&&n.push(a)}return n}};function Ff(i,e,t){let n=i.createShader(e);return i.shaderSource(n,t),i.compileShader(n),n}var Z0=37297,K0=0;function J0(i,e){let t=i.split(`
`),n=[],r=Math.max(e-6,0),s=Math.min(e+6,t.length);for(let a=r;a<s;a++){let o=a+1;n.push(`${o===e?">":" "} ${o}: ${t[a]}`)}return n.join(`
`)}var Bf=new Ne;function j0(i){Ye._getMatrix(Bf,Ye.workingColorSpace,i);let e=`mat3( ${Bf.elements.map(t=>t.toFixed(4))} )`;switch(Ye.getTransfer(i)){case ga:return[e,"LinearTransferOETF"];case je:return[e,"sRGBTransferOETF"];default:return console.warn("THREE.WebGLProgram: Unsupported color space: ",i),[e,"LinearTransferOETF"]}}function kf(i,e,t){let n=i.getShaderParameter(e,i.COMPILE_STATUS),r=i.getShaderInfoLog(e).trim();if(n&&r==="")return"";let s=/ERROR: 0:(\d+)/.exec(r);if(s){let a=parseInt(s[1]);return t.toUpperCase()+`

`+r+`

`+J0(i.getShaderSource(e),a)}else return r}function Q0(i,e){let t=j0(e);return[`vec4 ${i}( vec4 value ) {`,`	return ${t[1]}( vec4( value.rgb * ${t[0]}, value.a ) );`,"}"].join(`
`)}function e_(i,e){let t;switch(e){case fp:t="Linear";break;case hp:t="Reinhard";break;case dp:t="Cineon";break;case Tc:t="ACESFilmic";break;case mp:t="AgX";break;case gp:t="Neutral";break;case pp:t="Custom";break;default:console.warn("THREE.WebGLProgram: Unsupported toneMapping:",e),t="Linear"}return"vec3 "+i+"( vec3 color ) { return "+t+"ToneMapping( color ); }"}var Bs=new O;function t_(){Ye.getLuminanceCoefficients(Bs);let i=Bs.x.toFixed(4),e=Bs.y.toFixed(4),t=Bs.z.toFixed(4);return["float luminance( const in vec3 rgb ) {",`	const vec3 weights = vec3( ${i}, ${e}, ${t} );`,"	return dot( weights, rgb );","}"].join(`
`)}function n_(i){return[i.extensionClipCullDistance?"#extension GL_ANGLE_clip_cull_distance : require":"",i.extensionMultiDraw?"#extension GL_ANGLE_multi_draw : require":""].filter(Fr).join(`
`)}function i_(i){let e=[];for(let t in i){let n=i[t];n!==!1&&e.push("#define "+t+" "+n)}return e.join(`
`)}function r_(i,e){let t={},n=i.getProgramParameter(e,i.ACTIVE_ATTRIBUTES);for(let r=0;r<n;r++){let s=i.getActiveAttrib(e,r),a=s.name,o=1;s.type===i.FLOAT_MAT2&&(o=2),s.type===i.FLOAT_MAT3&&(o=3),s.type===i.FLOAT_MAT4&&(o=4),t[a]={type:s.type,location:i.getAttribLocation(e,a),locationSize:o}}return t}function Fr(i){return i!==""}function zf(i,e){let t=e.numSpotLightShadows+e.numSpotLightMaps-e.numSpotLightShadowsWithMaps;return i.replace(/NUM_DIR_LIGHTS/g,e.numDirLights).replace(/NUM_SPOT_LIGHTS/g,e.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,e.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,t).replace(/NUM_RECT_AREA_LIGHTS/g,e.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,e.numPointLights).replace(/NUM_HEMI_LIGHTS/g,e.numHemiLights).replace(/NUM_DIR_LIGHT_SHADOWS/g,e.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,e.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,e.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,e.numPointLightShadows)}function Hf(i,e){return i.replace(/NUM_CLIPPING_PLANES/g,e.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,e.numClippingPlanes-e.numClipIntersection)}var s_=/^[ \t]*#include +<([\w\d./]+)>/gm;function rc(i){return i.replace(s_,o_)}var a_=new Map;function o_(i,e){let t=Fe[e];if(t===void 0){let n=a_.get(e);if(n!==void 0)t=Fe[n],console.warn('THREE.WebGLRenderer: Shader chunk "%s" has been deprecated. Use "%s" instead.',e,n);else throw new Error("Can not resolve #include <"+e+">")}return rc(t)}var l_=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function Vf(i){return i.replace(l_,c_)}function c_(i,e,t,n){let r="";for(let s=parseInt(e);s<parseInt(t);s++)r+=n.replace(/\[\s*i\s*\]/g,"[ "+s+" ]").replace(/UNROLLED_LOOP_INDEX/g,s);return r}function Gf(i){let e=`precision ${i.precision} float;
	precision ${i.precision} int;
	precision ${i.precision} sampler2D;
	precision ${i.precision} samplerCube;
	precision ${i.precision} sampler3D;
	precision ${i.precision} sampler2DArray;
	precision ${i.precision} sampler2DShadow;
	precision ${i.precision} samplerCubeShadow;
	precision ${i.precision} sampler2DArrayShadow;
	precision ${i.precision} isampler2D;
	precision ${i.precision} isampler3D;
	precision ${i.precision} isamplerCube;
	precision ${i.precision} isampler2DArray;
	precision ${i.precision} usampler2D;
	precision ${i.precision} usampler3D;
	precision ${i.precision} usamplerCube;
	precision ${i.precision} usampler2DArray;
	`;return i.precision==="highp"?e+=`
#define HIGH_PRECISION`:i.precision==="mediump"?e+=`
#define MEDIUM_PRECISION`:i.precision==="lowp"&&(e+=`
#define LOW_PRECISION`),e}function u_(i){let e="SHADOWMAP_TYPE_BASIC";return i.shadowMapType===Qf?e="SHADOWMAP_TYPE_PCF":i.shadowMapType===Ec?e="SHADOWMAP_TYPE_PCF_SOFT":i.shadowMapType===Pn&&(e="SHADOWMAP_TYPE_VSM"),e}function f_(i){let e="ENVMAP_TYPE_CUBE";if(i.envMap)switch(i.envMapMode){case ar:case or:e="ENVMAP_TYPE_CUBE";break;case ma:e="ENVMAP_TYPE_CUBE_UV";break}return e}function h_(i){let e="ENVMAP_MODE_REFLECTION";return i.envMap&&i.envMapMode===or&&(e="ENVMAP_MODE_REFRACTION"),e}function d_(i){let e="ENVMAP_BLENDING_NONE";if(i.envMap)switch(i.combine){case eh:e="ENVMAP_BLENDING_MULTIPLY";break;case cp:e="ENVMAP_BLENDING_MIX";break;case up:e="ENVMAP_BLENDING_ADD";break}return e}function p_(i){let e=i.envMapCubeUVHeight;if(e===null)return null;let t=Math.log2(e)-2,n=1/e;return{texelWidth:1/(3*Math.max(Math.pow(2,t),112)),texelHeight:n,maxMip:t}}function m_(i,e,t,n){let r=i.getContext(),s=t.defines,a=t.vertexShader,o=t.fragmentShader,l=u_(t),c=f_(t),u=h_(t),f=d_(t),d=p_(t),p=n_(t),g=i_(s),_=r.createProgram(),m,h,T=t.glslVersion?"#version "+t.glslVersion+`
`:"";t.isRawShaderMaterial?(m=["#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,g].filter(Fr).join(`
`),m.length>0&&(m+=`
`),h=["#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,g].filter(Fr).join(`
`),h.length>0&&(h+=`
`)):(m=[Gf(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,g,t.extensionClipCullDistance?"#define USE_CLIP_DISTANCE":"",t.batching?"#define USE_BATCHING":"",t.batchingColor?"#define USE_BATCHING_COLOR":"",t.instancing?"#define USE_INSTANCING":"",t.instancingColor?"#define USE_INSTANCING_COLOR":"",t.instancingMorph?"#define USE_INSTANCING_MORPH":"",t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.map?"#define USE_MAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+u:"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.displacementMap?"#define USE_DISPLACEMENTMAP":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.mapUv?"#define MAP_UV "+t.mapUv:"",t.alphaMapUv?"#define ALPHAMAP_UV "+t.alphaMapUv:"",t.lightMapUv?"#define LIGHTMAP_UV "+t.lightMapUv:"",t.aoMapUv?"#define AOMAP_UV "+t.aoMapUv:"",t.emissiveMapUv?"#define EMISSIVEMAP_UV "+t.emissiveMapUv:"",t.bumpMapUv?"#define BUMPMAP_UV "+t.bumpMapUv:"",t.normalMapUv?"#define NORMALMAP_UV "+t.normalMapUv:"",t.displacementMapUv?"#define DISPLACEMENTMAP_UV "+t.displacementMapUv:"",t.metalnessMapUv?"#define METALNESSMAP_UV "+t.metalnessMapUv:"",t.roughnessMapUv?"#define ROUGHNESSMAP_UV "+t.roughnessMapUv:"",t.anisotropyMapUv?"#define ANISOTROPYMAP_UV "+t.anisotropyMapUv:"",t.clearcoatMapUv?"#define CLEARCOATMAP_UV "+t.clearcoatMapUv:"",t.clearcoatNormalMapUv?"#define CLEARCOAT_NORMALMAP_UV "+t.clearcoatNormalMapUv:"",t.clearcoatRoughnessMapUv?"#define CLEARCOAT_ROUGHNESSMAP_UV "+t.clearcoatRoughnessMapUv:"",t.iridescenceMapUv?"#define IRIDESCENCEMAP_UV "+t.iridescenceMapUv:"",t.iridescenceThicknessMapUv?"#define IRIDESCENCE_THICKNESSMAP_UV "+t.iridescenceThicknessMapUv:"",t.sheenColorMapUv?"#define SHEEN_COLORMAP_UV "+t.sheenColorMapUv:"",t.sheenRoughnessMapUv?"#define SHEEN_ROUGHNESSMAP_UV "+t.sheenRoughnessMapUv:"",t.specularMapUv?"#define SPECULARMAP_UV "+t.specularMapUv:"",t.specularColorMapUv?"#define SPECULAR_COLORMAP_UV "+t.specularColorMapUv:"",t.specularIntensityMapUv?"#define SPECULAR_INTENSITYMAP_UV "+t.specularIntensityMapUv:"",t.transmissionMapUv?"#define TRANSMISSIONMAP_UV "+t.transmissionMapUv:"",t.thicknessMapUv?"#define THICKNESSMAP_UV "+t.thicknessMapUv:"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexColors?"#define USE_COLOR":"",t.vertexAlphas?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.flatShading?"#define FLAT_SHADED":"",t.skinning?"#define USE_SKINNING":"",t.morphTargets?"#define USE_MORPHTARGETS":"",t.morphNormals&&t.flatShading===!1?"#define USE_MORPHNORMALS":"",t.morphColors?"#define USE_MORPHCOLORS":"",t.morphTargetsCount>0?"#define MORPHTARGETS_TEXTURE_STRIDE "+t.morphTextureStride:"",t.morphTargetsCount>0?"#define MORPHTARGETS_COUNT "+t.morphTargetsCount:"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+l:"",t.sizeAttenuation?"#define USE_SIZEATTENUATION":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.logarithmicDepthBuffer?"#define USE_LOGDEPTHBUF":"",t.reverseDepthBuffer?"#define USE_REVERSEDEPTHBUF":"","uniform mat4 modelMatrix;","uniform mat4 modelViewMatrix;","uniform mat4 projectionMatrix;","uniform mat4 viewMatrix;","uniform mat3 normalMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;","#ifdef USE_INSTANCING","	attribute mat4 instanceMatrix;","#endif","#ifdef USE_INSTANCING_COLOR","	attribute vec3 instanceColor;","#endif","#ifdef USE_INSTANCING_MORPH","	uniform sampler2D morphTexture;","#endif","attribute vec3 position;","attribute vec3 normal;","attribute vec2 uv;","#ifdef USE_UV1","	attribute vec2 uv1;","#endif","#ifdef USE_UV2","	attribute vec2 uv2;","#endif","#ifdef USE_UV3","	attribute vec2 uv3;","#endif","#ifdef USE_TANGENT","	attribute vec4 tangent;","#endif","#if defined( USE_COLOR_ALPHA )","	attribute vec4 color;","#elif defined( USE_COLOR )","	attribute vec3 color;","#endif","#ifdef USE_SKINNING","	attribute vec4 skinIndex;","	attribute vec4 skinWeight;","#endif",`
`].filter(Fr).join(`
`),h=[Gf(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,g,t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.alphaToCoverage?"#define ALPHA_TO_COVERAGE":"",t.map?"#define USE_MAP":"",t.matcap?"#define USE_MATCAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+c:"",t.envMap?"#define "+u:"",t.envMap?"#define "+f:"",d?"#define CUBEUV_TEXEL_WIDTH "+d.texelWidth:"",d?"#define CUBEUV_TEXEL_HEIGHT "+d.texelHeight:"",d?"#define CUBEUV_MAX_MIP "+d.maxMip+".0":"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoat?"#define USE_CLEARCOAT":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.dispersion?"#define USE_DISPERSION":"",t.iridescence?"#define USE_IRIDESCENCE":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaTest?"#define USE_ALPHATEST":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.sheen?"#define USE_SHEEN":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexColors||t.instancingColor||t.batchingColor?"#define USE_COLOR":"",t.vertexAlphas?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.gradientMap?"#define USE_GRADIENTMAP":"",t.flatShading?"#define FLAT_SHADED":"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+l:"",t.premultipliedAlpha?"#define PREMULTIPLIED_ALPHA":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.decodeVideoTexture?"#define DECODE_VIDEO_TEXTURE":"",t.decodeVideoTextureEmissive?"#define DECODE_VIDEO_TEXTURE_EMISSIVE":"",t.logarithmicDepthBuffer?"#define USE_LOGDEPTHBUF":"",t.reverseDepthBuffer?"#define USE_REVERSEDEPTHBUF":"","uniform mat4 viewMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;",t.toneMapping!==Qn?"#define TONE_MAPPING":"",t.toneMapping!==Qn?Fe.tonemapping_pars_fragment:"",t.toneMapping!==Qn?e_("toneMapping",t.toneMapping):"",t.dithering?"#define DITHERING":"",t.opaque?"#define OPAQUE":"",Fe.colorspace_pars_fragment,Q0("linearToOutputTexel",t.outputColorSpace),t_(),t.useDepthPacking?"#define DEPTH_PACKING "+t.depthPacking:"",`
`].filter(Fr).join(`
`)),a=rc(a),a=zf(a,t),a=Hf(a,t),o=rc(o),o=zf(o,t),o=Hf(o,t),a=Vf(a),o=Vf(o),t.isRawShaderMaterial!==!0&&(T=`#version 300 es
`,m=[p,"#define attribute in","#define varying out","#define texture2D texture"].join(`
`)+`
`+m,h=["#define varying in",t.glslVersion===tf?"":"layout(location = 0) out highp vec4 pc_fragColor;",t.glslVersion===tf?"":"#define gl_FragColor pc_fragColor","#define gl_FragDepthEXT gl_FragDepth","#define texture2D texture","#define textureCube texture","#define texture2DProj textureProj","#define texture2DLodEXT textureLod","#define texture2DProjLodEXT textureProjLod","#define textureCubeLodEXT textureLod","#define texture2DGradEXT textureGrad","#define texture2DProjGradEXT textureProjGrad","#define textureCubeGradEXT textureGrad"].join(`
`)+`
`+h);let w=T+m+a,M=T+h+o,N=Ff(r,r.VERTEX_SHADER,w),A=Ff(r,r.FRAGMENT_SHADER,M);r.attachShader(_,N),r.attachShader(_,A),t.index0AttributeName!==void 0?r.bindAttribLocation(_,0,t.index0AttributeName):t.morphTargets===!0&&r.bindAttribLocation(_,0,"position"),r.linkProgram(_);function C(R){if(i.debug.checkShaderErrors){let V=r.getProgramInfoLog(_).trim(),z=r.getShaderInfoLog(N).trim(),X=r.getShaderInfoLog(A).trim(),J=!0,q=!0;if(r.getProgramParameter(_,r.LINK_STATUS)===!1)if(J=!1,typeof i.debug.onShaderError=="function")i.debug.onShaderError(r,_,N,A);else{let te=kf(r,N,"vertex"),W=kf(r,A,"fragment");console.error("THREE.WebGLProgram: Shader Error "+r.getError()+" - VALIDATE_STATUS "+r.getProgramParameter(_,r.VALIDATE_STATUS)+`

Material Name: `+R.name+`
Material Type: `+R.type+`

Program Info Log: `+V+`
`+te+`
`+W)}else V!==""?console.warn("THREE.WebGLProgram: Program Info Log:",V):(z===""||X==="")&&(q=!1);q&&(R.diagnostics={runnable:J,programLog:V,vertexShader:{log:z,prefix:m},fragmentShader:{log:X,prefix:h}})}r.deleteShader(N),r.deleteShader(A),D=new rr(r,_),b=r_(r,_)}let D;this.getUniforms=function(){return D===void 0&&C(this),D};let b;this.getAttributes=function(){return b===void 0&&C(this),b};let S=t.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return S===!1&&(S=r.getProgramParameter(_,Z0)),S},this.destroy=function(){n.releaseStatesOfProgram(this),r.deleteProgram(_),this.program=void 0},this.type=t.shaderType,this.name=t.shaderName,this.id=K0++,this.cacheKey=e,this.usedTimes=1,this.program=_,this.vertexShader=N,this.fragmentShader=A,this}var g_=0,sc=class{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(e){let t=e.vertexShader,n=e.fragmentShader,r=this._getShaderStage(t),s=this._getShaderStage(n),a=this._getShaderCacheForMaterial(e);return a.has(r)===!1&&(a.add(r),r.usedTimes++),a.has(s)===!1&&(a.add(s),s.usedTimes++),this}remove(e){let t=this.materialCache.get(e);for(let n of t)n.usedTimes--,n.usedTimes===0&&this.shaderCache.delete(n.code);return this.materialCache.delete(e),this}getVertexShaderID(e){return this._getShaderStage(e.vertexShader).id}getFragmentShaderID(e){return this._getShaderStage(e.fragmentShader).id}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(e){let t=this.materialCache,n=t.get(e);return n===void 0&&(n=new Set,t.set(e,n)),n}_getShaderStage(e){let t=this.shaderCache,n=t.get(e);return n===void 0&&(n=new ac(e),t.set(e,n)),n}},ac=class{constructor(e){this.id=g_++,this.code=e,this.usedTimes=0}};function x_(i,e,t,n,r,s,a){let o=new Wr,l=new sc,c=new Set,u=[],f=r.logarithmicDepthBuffer,d=r.vertexTextures,p=r.precision,g={MeshDepthMaterial:"depth",MeshDistanceMaterial:"distanceRGBA",MeshNormalMaterial:"normal",MeshBasicMaterial:"basic",MeshLambertMaterial:"lambert",MeshPhongMaterial:"phong",MeshToonMaterial:"toon",MeshStandardMaterial:"physical",MeshPhysicalMaterial:"physical",MeshMatcapMaterial:"matcap",LineBasicMaterial:"basic",LineDashedMaterial:"dashed",PointsMaterial:"points",ShadowMaterial:"shadow",SpriteMaterial:"sprite"};function _(b){return c.add(b),b===0?"uv":`uv${b}`}function m(b,S,R,V,z){let X=V.fog,J=z.geometry,q=b.isMeshStandardMaterial?V.environment:null,te=(b.isMeshStandardMaterial?t:e).get(b.envMap||q),W=te&&te.mapping===ma?te.image.height:null,se=g[b.type];b.precision!==null&&(p=r.getMaxPrecision(b.precision),p!==b.precision&&console.warn("THREE.WebGLProgram.getParameters:",b.precision,"not supported, using",p,"instead."));let fe=J.morphAttributes.position||J.morphAttributes.normal||J.morphAttributes.color,Me=fe!==void 0?fe.length:0,Be=0;J.morphAttributes.position!==void 0&&(Be=1),J.morphAttributes.normal!==void 0&&(Be=2),J.morphAttributes.color!==void 0&&(Be=3);let tt,$,ne,_e;if(se){let Je=pn[se];tt=Je.vertexShader,$=Je.fragmentShader}else tt=b.vertexShader,$=b.fragmentShader,l.update(b),ne=l.getVertexShaderID(b),_e=l.getFragmentShaderID(b);let ae=i.getRenderTarget(),Ce=i.state.buffers.depth.getReversed(),Ie=z.isInstancedMesh===!0,ke=z.isBatchedMesh===!0,ut=!!b.map,Xe=!!b.matcap,pt=!!te,U=!!b.aoMap,Xt=!!b.lightMap,Ve=!!b.bumpMap,Ge=!!b.normalMap,Ee=!!b.displacementMap,st=!!b.emissiveMap,be=!!b.metalnessMap,E=!!b.roughnessMap,x=b.anisotropy>0,F=b.clearcoat>0,Z=b.dispersion>0,j=b.iridescence>0,Y=b.sheen>0,ve=b.transmission>0,oe=x&&!!b.anisotropyMap,he=F&&!!b.clearcoatMap,qe=F&&!!b.clearcoatNormalMap,Q=F&&!!b.clearcoatRoughnessMap,de=j&&!!b.iridescenceMap,Ae=j&&!!b.iridescenceThicknessMap,Re=Y&&!!b.sheenColorMap,pe=Y&&!!b.sheenRoughnessMap,We=!!b.specularMap,Oe=!!b.specularColorMap,nt=!!b.specularIntensityMap,P=ve&&!!b.transmissionMap,re=ve&&!!b.thicknessMap,G=!!b.gradientMap,K=!!b.alphaMap,ue=b.alphaTest>0,le=!!b.alphaHash,Le=!!b.extensions,ft=Qn;b.toneMapped&&(ae===null||ae.isXRRenderTarget===!0)&&(ft=i.toneMapping);let At={shaderID:se,shaderType:b.type,shaderName:b.name,vertexShader:tt,fragmentShader:$,defines:b.defines,customVertexShaderID:ne,customFragmentShaderID:_e,isRawShaderMaterial:b.isRawShaderMaterial===!0,glslVersion:b.glslVersion,precision:p,batching:ke,batchingColor:ke&&z._colorsTexture!==null,instancing:Ie,instancingColor:Ie&&z.instanceColor!==null,instancingMorph:Ie&&z.morphTexture!==null,supportsVertexTextures:d,outputColorSpace:ae===null?i.outputColorSpace:ae.isXRRenderTarget===!0?ae.texture.colorSpace:mr,alphaToCoverage:!!b.alphaToCoverage,map:ut,matcap:Xe,envMap:pt,envMapMode:pt&&te.mapping,envMapCubeUVHeight:W,aoMap:U,lightMap:Xt,bumpMap:Ve,normalMap:Ge,displacementMap:d&&Ee,emissiveMap:st,normalMapObjectSpace:Ge&&b.normalMapType===vp,normalMapTangentSpace:Ge&&b.normalMapType===hh,metalnessMap:be,roughnessMap:E,anisotropy:x,anisotropyMap:oe,clearcoat:F,clearcoatMap:he,clearcoatNormalMap:qe,clearcoatRoughnessMap:Q,dispersion:Z,iridescence:j,iridescenceMap:de,iridescenceThicknessMap:Ae,sheen:Y,sheenColorMap:Re,sheenRoughnessMap:pe,specularMap:We,specularColorMap:Oe,specularIntensityMap:nt,transmission:ve,transmissionMap:P,thicknessMap:re,gradientMap:G,opaque:b.transparent===!1&&b.blending===tr&&b.alphaToCoverage===!1,alphaMap:K,alphaTest:ue,alphaHash:le,combine:b.combine,mapUv:ut&&_(b.map.channel),aoMapUv:U&&_(b.aoMap.channel),lightMapUv:Xt&&_(b.lightMap.channel),bumpMapUv:Ve&&_(b.bumpMap.channel),normalMapUv:Ge&&_(b.normalMap.channel),displacementMapUv:Ee&&_(b.displacementMap.channel),emissiveMapUv:st&&_(b.emissiveMap.channel),metalnessMapUv:be&&_(b.metalnessMap.channel),roughnessMapUv:E&&_(b.roughnessMap.channel),anisotropyMapUv:oe&&_(b.anisotropyMap.channel),clearcoatMapUv:he&&_(b.clearcoatMap.channel),clearcoatNormalMapUv:qe&&_(b.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:Q&&_(b.clearcoatRoughnessMap.channel),iridescenceMapUv:de&&_(b.iridescenceMap.channel),iridescenceThicknessMapUv:Ae&&_(b.iridescenceThicknessMap.channel),sheenColorMapUv:Re&&_(b.sheenColorMap.channel),sheenRoughnessMapUv:pe&&_(b.sheenRoughnessMap.channel),specularMapUv:We&&_(b.specularMap.channel),specularColorMapUv:Oe&&_(b.specularColorMap.channel),specularIntensityMapUv:nt&&_(b.specularIntensityMap.channel),transmissionMapUv:P&&_(b.transmissionMap.channel),thicknessMapUv:re&&_(b.thicknessMap.channel),alphaMapUv:K&&_(b.alphaMap.channel),vertexTangents:!!J.attributes.tangent&&(Ge||x),vertexColors:b.vertexColors,vertexAlphas:b.vertexColors===!0&&!!J.attributes.color&&J.attributes.color.itemSize===4,pointsUvs:z.isPoints===!0&&!!J.attributes.uv&&(ut||K),fog:!!X,useFog:b.fog===!0,fogExp2:!!X&&X.isFogExp2,flatShading:b.flatShading===!0,sizeAttenuation:b.sizeAttenuation===!0,logarithmicDepthBuffer:f,reverseDepthBuffer:Ce,skinning:z.isSkinnedMesh===!0,morphTargets:J.morphAttributes.position!==void 0,morphNormals:J.morphAttributes.normal!==void 0,morphColors:J.morphAttributes.color!==void 0,morphTargetsCount:Me,morphTextureStride:Be,numDirLights:S.directional.length,numPointLights:S.point.length,numSpotLights:S.spot.length,numSpotLightMaps:S.spotLightMap.length,numRectAreaLights:S.rectArea.length,numHemiLights:S.hemi.length,numDirLightShadows:S.directionalShadowMap.length,numPointLightShadows:S.pointShadowMap.length,numSpotLightShadows:S.spotShadowMap.length,numSpotLightShadowsWithMaps:S.numSpotLightShadowsWithMaps,numLightProbes:S.numLightProbes,numClippingPlanes:a.numPlanes,numClipIntersection:a.numIntersection,dithering:b.dithering,shadowMapEnabled:i.shadowMap.enabled&&R.length>0,shadowMapType:i.shadowMap.type,toneMapping:ft,decodeVideoTexture:ut&&b.map.isVideoTexture===!0&&Ye.getTransfer(b.map.colorSpace)===je,decodeVideoTextureEmissive:st&&b.emissiveMap.isVideoTexture===!0&&Ye.getTransfer(b.emissiveMap.colorSpace)===je,premultipliedAlpha:b.premultipliedAlpha,doubleSided:b.side===In,flipSided:b.side===Ot,useDepthPacking:b.depthPacking>=0,depthPacking:b.depthPacking||0,index0AttributeName:b.index0AttributeName,extensionClipCullDistance:Le&&b.extensions.clipCullDistance===!0&&n.has("WEBGL_clip_cull_distance"),extensionMultiDraw:(Le&&b.extensions.multiDraw===!0||ke)&&n.has("WEBGL_multi_draw"),rendererExtensionParallelShaderCompile:n.has("KHR_parallel_shader_compile"),customProgramCacheKey:b.customProgramCacheKey()};return At.vertexUv1s=c.has(1),At.vertexUv2s=c.has(2),At.vertexUv3s=c.has(3),c.clear(),At}function h(b){let S=[];if(b.shaderID?S.push(b.shaderID):(S.push(b.customVertexShaderID),S.push(b.customFragmentShaderID)),b.defines!==void 0)for(let R in b.defines)S.push(R),S.push(b.defines[R]);return b.isRawShaderMaterial===!1&&(T(S,b),w(S,b),S.push(i.outputColorSpace)),S.push(b.customProgramCacheKey),S.join()}function T(b,S){b.push(S.precision),b.push(S.outputColorSpace),b.push(S.envMapMode),b.push(S.envMapCubeUVHeight),b.push(S.mapUv),b.push(S.alphaMapUv),b.push(S.lightMapUv),b.push(S.aoMapUv),b.push(S.bumpMapUv),b.push(S.normalMapUv),b.push(S.displacementMapUv),b.push(S.emissiveMapUv),b.push(S.metalnessMapUv),b.push(S.roughnessMapUv),b.push(S.anisotropyMapUv),b.push(S.clearcoatMapUv),b.push(S.clearcoatNormalMapUv),b.push(S.clearcoatRoughnessMapUv),b.push(S.iridescenceMapUv),b.push(S.iridescenceThicknessMapUv),b.push(S.sheenColorMapUv),b.push(S.sheenRoughnessMapUv),b.push(S.specularMapUv),b.push(S.specularColorMapUv),b.push(S.specularIntensityMapUv),b.push(S.transmissionMapUv),b.push(S.thicknessMapUv),b.push(S.combine),b.push(S.fogExp2),b.push(S.sizeAttenuation),b.push(S.morphTargetsCount),b.push(S.morphAttributeCount),b.push(S.numDirLights),b.push(S.numPointLights),b.push(S.numSpotLights),b.push(S.numSpotLightMaps),b.push(S.numHemiLights),b.push(S.numRectAreaLights),b.push(S.numDirLightShadows),b.push(S.numPointLightShadows),b.push(S.numSpotLightShadows),b.push(S.numSpotLightShadowsWithMaps),b.push(S.numLightProbes),b.push(S.shadowMapType),b.push(S.toneMapping),b.push(S.numClippingPlanes),b.push(S.numClipIntersection),b.push(S.depthPacking)}function w(b,S){o.disableAll(),S.supportsVertexTextures&&o.enable(0),S.instancing&&o.enable(1),S.instancingColor&&o.enable(2),S.instancingMorph&&o.enable(3),S.matcap&&o.enable(4),S.envMap&&o.enable(5),S.normalMapObjectSpace&&o.enable(6),S.normalMapTangentSpace&&o.enable(7),S.clearcoat&&o.enable(8),S.iridescence&&o.enable(9),S.alphaTest&&o.enable(10),S.vertexColors&&o.enable(11),S.vertexAlphas&&o.enable(12),S.vertexUv1s&&o.enable(13),S.vertexUv2s&&o.enable(14),S.vertexUv3s&&o.enable(15),S.vertexTangents&&o.enable(16),S.anisotropy&&o.enable(17),S.alphaHash&&o.enable(18),S.batching&&o.enable(19),S.dispersion&&o.enable(20),S.batchingColor&&o.enable(21),b.push(o.mask),o.disableAll(),S.fog&&o.enable(0),S.useFog&&o.enable(1),S.flatShading&&o.enable(2),S.logarithmicDepthBuffer&&o.enable(3),S.reverseDepthBuffer&&o.enable(4),S.skinning&&o.enable(5),S.morphTargets&&o.enable(6),S.morphNormals&&o.enable(7),S.morphColors&&o.enable(8),S.premultipliedAlpha&&o.enable(9),S.shadowMapEnabled&&o.enable(10),S.doubleSided&&o.enable(11),S.flipSided&&o.enable(12),S.useDepthPacking&&o.enable(13),S.dithering&&o.enable(14),S.transmission&&o.enable(15),S.sheen&&o.enable(16),S.opaque&&o.enable(17),S.pointsUvs&&o.enable(18),S.decodeVideoTexture&&o.enable(19),S.decodeVideoTextureEmissive&&o.enable(20),S.alphaToCoverage&&o.enable(21),b.push(o.mask)}function M(b){let S=g[b.type],R;if(S){let V=pn[S];R=om.clone(V.uniforms)}else R=b.uniforms;return R}function N(b,S){let R;for(let V=0,z=u.length;V<z;V++){let X=u[V];if(X.cacheKey===S){R=X,++R.usedTimes;break}}return R===void 0&&(R=new m_(i,S,b,s),u.push(R)),R}function A(b){if(--b.usedTimes===0){let S=u.indexOf(b);u[S]=u[u.length-1],u.pop(),b.destroy()}}function C(b){l.remove(b)}function D(){l.dispose()}return{getParameters:m,getProgramCacheKey:h,getUniforms:M,acquireProgram:N,releaseProgram:A,releaseShaderCache:C,programs:u,dispose:D}}function __(){let i=new WeakMap;function e(a){return i.has(a)}function t(a){let o=i.get(a);return o===void 0&&(o={},i.set(a,o)),o}function n(a){i.delete(a)}function r(a,o,l){i.get(a)[o]=l}function s(){i=new WeakMap}return{has:e,get:t,remove:n,update:r,dispose:s}}function y_(i,e){return i.groupOrder!==e.groupOrder?i.groupOrder-e.groupOrder:i.renderOrder!==e.renderOrder?i.renderOrder-e.renderOrder:i.material.id!==e.material.id?i.material.id-e.material.id:i.z!==e.z?i.z-e.z:i.id-e.id}function Wf(i,e){return i.groupOrder!==e.groupOrder?i.groupOrder-e.groupOrder:i.renderOrder!==e.renderOrder?i.renderOrder-e.renderOrder:i.z!==e.z?e.z-i.z:i.id-e.id}function Xf(){let i=[],e=0,t=[],n=[],r=[];function s(){e=0,t.length=0,n.length=0,r.length=0}function a(f,d,p,g,_,m){let h=i[e];return h===void 0?(h={id:f.id,object:f,geometry:d,material:p,groupOrder:g,renderOrder:f.renderOrder,z:_,group:m},i[e]=h):(h.id=f.id,h.object=f,h.geometry=d,h.material=p,h.groupOrder=g,h.renderOrder=f.renderOrder,h.z=_,h.group=m),e++,h}function o(f,d,p,g,_,m){let h=a(f,d,p,g,_,m);p.transmission>0?n.push(h):p.transparent===!0?r.push(h):t.push(h)}function l(f,d,p,g,_,m){let h=a(f,d,p,g,_,m);p.transmission>0?n.unshift(h):p.transparent===!0?r.unshift(h):t.unshift(h)}function c(f,d){t.length>1&&t.sort(f||y_),n.length>1&&n.sort(d||Wf),r.length>1&&r.sort(d||Wf)}function u(){for(let f=e,d=i.length;f<d;f++){let p=i[f];if(p.id===null)break;p.id=null,p.object=null,p.geometry=null,p.material=null,p.group=null}}return{opaque:t,transmissive:n,transparent:r,init:s,push:o,unshift:l,finish:u,sort:c}}function v_(){let i=new WeakMap;function e(n,r){let s=i.get(n),a;return s===void 0?(a=new Xf,i.set(n,[a])):r>=s.length?(a=new Xf,s.push(a)):a=s[r],a}function t(){i=new WeakMap}return{get:e,dispose:t}}function S_(){let i={};return{get:function(e){if(i[e.id]!==void 0)return i[e.id];let t;switch(e.type){case"DirectionalLight":t={direction:new O,color:new ze};break;case"SpotLight":t={position:new O,direction:new O,color:new ze,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case"PointLight":t={position:new O,color:new ze,distance:0,decay:0};break;case"HemisphereLight":t={direction:new O,skyColor:new ze,groundColor:new ze};break;case"RectAreaLight":t={color:new ze,position:new O,halfWidth:new O,halfHeight:new O};break}return i[e.id]=t,t}}}function M_(){let i={};return{get:function(e){if(i[e.id]!==void 0)return i[e.id];let t;switch(e.type){case"DirectionalLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new we};break;case"SpotLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new we};break;case"PointLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new we,shadowCameraNear:1,shadowCameraFar:1e3};break}return i[e.id]=t,t}}}var b_=0;function w_(i,e){return(e.castShadow?2:0)-(i.castShadow?2:0)+(e.map?1:0)-(i.map?1:0)}function E_(i){let e=new S_,t=M_(),n={version:0,hash:{directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let c=0;c<9;c++)n.probe.push(new O);let r=new O,s=new dt,a=new dt;function o(c){let u=0,f=0,d=0;for(let b=0;b<9;b++)n.probe[b].set(0,0,0);let p=0,g=0,_=0,m=0,h=0,T=0,w=0,M=0,N=0,A=0,C=0;c.sort(w_);for(let b=0,S=c.length;b<S;b++){let R=c[b],V=R.color,z=R.intensity,X=R.distance,J=R.shadow&&R.shadow.map?R.shadow.map.texture:null;if(R.isAmbientLight)u+=V.r*z,f+=V.g*z,d+=V.b*z;else if(R.isLightProbe){for(let q=0;q<9;q++)n.probe[q].addScaledVector(R.sh.coefficients[q],z);C++}else if(R.isDirectionalLight){let q=e.get(R);if(q.color.copy(R.color).multiplyScalar(R.intensity),R.castShadow){let te=R.shadow,W=t.get(R);W.shadowIntensity=te.intensity,W.shadowBias=te.bias,W.shadowNormalBias=te.normalBias,W.shadowRadius=te.radius,W.shadowMapSize=te.mapSize,n.directionalShadow[p]=W,n.directionalShadowMap[p]=J,n.directionalShadowMatrix[p]=R.shadow.matrix,T++}n.directional[p]=q,p++}else if(R.isSpotLight){let q=e.get(R);q.position.setFromMatrixPosition(R.matrixWorld),q.color.copy(V).multiplyScalar(z),q.distance=X,q.coneCos=Math.cos(R.angle),q.penumbraCos=Math.cos(R.angle*(1-R.penumbra)),q.decay=R.decay,n.spot[_]=q;let te=R.shadow;if(R.map&&(n.spotLightMap[N]=R.map,N++,te.updateMatrices(R),R.castShadow&&A++),n.spotLightMatrix[_]=te.matrix,R.castShadow){let W=t.get(R);W.shadowIntensity=te.intensity,W.shadowBias=te.bias,W.shadowNormalBias=te.normalBias,W.shadowRadius=te.radius,W.shadowMapSize=te.mapSize,n.spotShadow[_]=W,n.spotShadowMap[_]=J,M++}_++}else if(R.isRectAreaLight){let q=e.get(R);q.color.copy(V).multiplyScalar(z),q.halfWidth.set(R.width*.5,0,0),q.halfHeight.set(0,R.height*.5,0),n.rectArea[m]=q,m++}else if(R.isPointLight){let q=e.get(R);if(q.color.copy(R.color).multiplyScalar(R.intensity),q.distance=R.distance,q.decay=R.decay,R.castShadow){let te=R.shadow,W=t.get(R);W.shadowIntensity=te.intensity,W.shadowBias=te.bias,W.shadowNormalBias=te.normalBias,W.shadowRadius=te.radius,W.shadowMapSize=te.mapSize,W.shadowCameraNear=te.camera.near,W.shadowCameraFar=te.camera.far,n.pointShadow[g]=W,n.pointShadowMap[g]=J,n.pointShadowMatrix[g]=R.shadow.matrix,w++}n.point[g]=q,g++}else if(R.isHemisphereLight){let q=e.get(R);q.skyColor.copy(R.color).multiplyScalar(z),q.groundColor.copy(R.groundColor).multiplyScalar(z),n.hemi[h]=q,h++}}m>0&&(i.has("OES_texture_float_linear")===!0?(n.rectAreaLTC1=ie.LTC_FLOAT_1,n.rectAreaLTC2=ie.LTC_FLOAT_2):(n.rectAreaLTC1=ie.LTC_HALF_1,n.rectAreaLTC2=ie.LTC_HALF_2)),n.ambient[0]=u,n.ambient[1]=f,n.ambient[2]=d;let D=n.hash;(D.directionalLength!==p||D.pointLength!==g||D.spotLength!==_||D.rectAreaLength!==m||D.hemiLength!==h||D.numDirectionalShadows!==T||D.numPointShadows!==w||D.numSpotShadows!==M||D.numSpotMaps!==N||D.numLightProbes!==C)&&(n.directional.length=p,n.spot.length=_,n.rectArea.length=m,n.point.length=g,n.hemi.length=h,n.directionalShadow.length=T,n.directionalShadowMap.length=T,n.pointShadow.length=w,n.pointShadowMap.length=w,n.spotShadow.length=M,n.spotShadowMap.length=M,n.directionalShadowMatrix.length=T,n.pointShadowMatrix.length=w,n.spotLightMatrix.length=M+N-A,n.spotLightMap.length=N,n.numSpotLightShadowsWithMaps=A,n.numLightProbes=C,D.directionalLength=p,D.pointLength=g,D.spotLength=_,D.rectAreaLength=m,D.hemiLength=h,D.numDirectionalShadows=T,D.numPointShadows=w,D.numSpotShadows=M,D.numSpotMaps=N,D.numLightProbes=C,n.version=b_++)}function l(c,u){let f=0,d=0,p=0,g=0,_=0,m=u.matrixWorldInverse;for(let h=0,T=c.length;h<T;h++){let w=c[h];if(w.isDirectionalLight){let M=n.directional[f];M.direction.setFromMatrixPosition(w.matrixWorld),r.setFromMatrixPosition(w.target.matrixWorld),M.direction.sub(r),M.direction.transformDirection(m),f++}else if(w.isSpotLight){let M=n.spot[p];M.position.setFromMatrixPosition(w.matrixWorld),M.position.applyMatrix4(m),M.direction.setFromMatrixPosition(w.matrixWorld),r.setFromMatrixPosition(w.target.matrixWorld),M.direction.sub(r),M.direction.transformDirection(m),p++}else if(w.isRectAreaLight){let M=n.rectArea[g];M.position.setFromMatrixPosition(w.matrixWorld),M.position.applyMatrix4(m),a.identity(),s.copy(w.matrixWorld),s.premultiply(m),a.extractRotation(s),M.halfWidth.set(w.width*.5,0,0),M.halfHeight.set(0,w.height*.5,0),M.halfWidth.applyMatrix4(a),M.halfHeight.applyMatrix4(a),g++}else if(w.isPointLight){let M=n.point[d];M.position.setFromMatrixPosition(w.matrixWorld),M.position.applyMatrix4(m),d++}else if(w.isHemisphereLight){let M=n.hemi[_];M.direction.setFromMatrixPosition(w.matrixWorld),M.direction.transformDirection(m),_++}}}return{setup:o,setupView:l,state:n}}function qf(i){let e=new E_(i),t=[],n=[];function r(u){c.camera=u,t.length=0,n.length=0}function s(u){t.push(u)}function a(u){n.push(u)}function o(){e.setup(t)}function l(u){e.setupView(t,u)}let c={lightsArray:t,shadowsArray:n,camera:null,lights:e,transmissionRenderTarget:{}};return{init:r,state:c,setupLights:o,setupLightsView:l,pushLight:s,pushShadow:a}}function T_(i){let e=new WeakMap;function t(r,s=0){let a=e.get(r),o;return a===void 0?(o=new qf(i),e.set(r,[o])):s>=a.length?(o=new qf(i),a.push(o)):o=a[s],o}function n(){e=new WeakMap}return{get:t,dispose:n}}var oc=class extends vi{static get type(){return"MeshDepthMaterial"}constructor(e){super(),this.isMeshDepthMaterial=!0,this.depthPacking=_p,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(e)}copy(e){return super.copy(e),this.depthPacking=e.depthPacking,this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this}},lc=class extends vi{static get type(){return"MeshDistanceMaterial"}constructor(e){super(),this.isMeshDistanceMaterial=!0,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(e)}copy(e){return super.copy(e),this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this}},A_=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,C_=`uniform sampler2D shadow_pass;
uniform vec2 resolution;
uniform float radius;
#include <packing>
void main() {
	const float samples = float( VSM_SAMPLES );
	float mean = 0.0;
	float squared_mean = 0.0;
	float uvStride = samples <= 1.0 ? 0.0 : 2.0 / ( samples - 1.0 );
	float uvStart = samples <= 1.0 ? 0.0 : - 1.0;
	for ( float i = 0.0; i < samples; i ++ ) {
		float uvOffset = uvStart + i * uvStride;
		#ifdef HORIZONTAL_PASS
			vec2 distribution = unpackRGBATo2Half( texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( uvOffset, 0.0 ) * radius ) / resolution ) );
			mean += distribution.x;
			squared_mean += distribution.y * distribution.y + distribution.x * distribution.x;
		#else
			float depth = unpackRGBAToDepth( texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( 0.0, uvOffset ) * radius ) / resolution ) );
			mean += depth;
			squared_mean += depth * depth;
		#endif
	}
	mean = mean / samples;
	squared_mean = squared_mean / samples;
	float std_dev = sqrt( squared_mean - mean * mean );
	gl_FragColor = pack2HalfToRGBA( vec2( mean, std_dev ) );
}`;function R_(i,e,t){let n=new Xr,r=new we,s=new we,a=new ht,o=new oc({depthPacking:yp}),l=new lc,c={},u=t.maxTextureSize,f={[ei]:Ot,[Ot]:ei,[In]:In},d=new xn({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new we},radius:{value:4}},vertexShader:A_,fragmentShader:C_}),p=d.clone();p.defines.HORIZONTAL_PASS=1;let g=new cn;g.setAttribute("position",new $t(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));let _=new Qe(g,d),m=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=Qf;let h=this.type;this.render=function(A,C,D){if(m.enabled===!1||m.autoUpdate===!1&&m.needsUpdate===!1||A.length===0)return;let b=i.getRenderTarget(),S=i.getActiveCubeFace(),R=i.getActiveMipmapLevel(),V=i.state;V.setBlending(jn),V.buffers.color.setClear(1,1,1,1),V.buffers.depth.setTest(!0),V.setScissorTest(!1);let z=h!==Pn&&this.type===Pn,X=h===Pn&&this.type!==Pn;for(let J=0,q=A.length;J<q;J++){let te=A[J],W=te.shadow;if(W===void 0){console.warn("THREE.WebGLShadowMap:",te,"has no shadow.");continue}if(W.autoUpdate===!1&&W.needsUpdate===!1)continue;r.copy(W.mapSize);let se=W.getFrameExtents();if(r.multiply(se),s.copy(W.mapSize),(r.x>u||r.y>u)&&(r.x>u&&(s.x=Math.floor(u/se.x),r.x=s.x*se.x,W.mapSize.x=s.x),r.y>u&&(s.y=Math.floor(u/se.y),r.y=s.y*se.y,W.mapSize.y=s.y)),W.map===null||z===!0||X===!0){let Me=this.type!==Pn?{minFilter:on,magFilter:on}:{};W.map!==null&&W.map.dispose(),W.map=new Fn(r.x,r.y,Me),W.map.texture.name=te.name+".shadowMap",W.camera.updateProjectionMatrix()}i.setRenderTarget(W.map),i.clear();let fe=W.getViewportCount();for(let Me=0;Me<fe;Me++){let Be=W.getViewport(Me);a.set(s.x*Be.x,s.y*Be.y,s.x*Be.z,s.y*Be.w),V.viewport(a),W.updateMatrices(te,Me),n=W.getFrustum(),M(C,D,W.camera,te,this.type)}W.isPointLightShadow!==!0&&this.type===Pn&&T(W,D),W.needsUpdate=!1}h=this.type,m.needsUpdate=!1,i.setRenderTarget(b,S,R)};function T(A,C){let D=e.update(_);d.defines.VSM_SAMPLES!==A.blurSamples&&(d.defines.VSM_SAMPLES=A.blurSamples,p.defines.VSM_SAMPLES=A.blurSamples,d.needsUpdate=!0,p.needsUpdate=!0),A.mapPass===null&&(A.mapPass=new Fn(r.x,r.y)),d.uniforms.shadow_pass.value=A.map.texture,d.uniforms.resolution.value=A.mapSize,d.uniforms.radius.value=A.radius,i.setRenderTarget(A.mapPass),i.clear(),i.renderBufferDirect(C,null,D,d,_,null),p.uniforms.shadow_pass.value=A.mapPass.texture,p.uniforms.resolution.value=A.mapSize,p.uniforms.radius.value=A.radius,i.setRenderTarget(A.map),i.clear(),i.renderBufferDirect(C,null,D,p,_,null)}function w(A,C,D,b){let S=null,R=D.isPointLight===!0?A.customDistanceMaterial:A.customDepthMaterial;if(R!==void 0)S=R;else if(S=D.isPointLight===!0?l:o,i.localClippingEnabled&&C.clipShadows===!0&&Array.isArray(C.clippingPlanes)&&C.clippingPlanes.length!==0||C.displacementMap&&C.displacementScale!==0||C.alphaMap&&C.alphaTest>0||C.map&&C.alphaTest>0){let V=S.uuid,z=C.uuid,X=c[V];X===void 0&&(X={},c[V]=X);let J=X[z];J===void 0&&(J=S.clone(),X[z]=J,C.addEventListener("dispose",N)),S=J}if(S.visible=C.visible,S.wireframe=C.wireframe,b===Pn?S.side=C.shadowSide!==null?C.shadowSide:C.side:S.side=C.shadowSide!==null?C.shadowSide:f[C.side],S.alphaMap=C.alphaMap,S.alphaTest=C.alphaTest,S.map=C.map,S.clipShadows=C.clipShadows,S.clippingPlanes=C.clippingPlanes,S.clipIntersection=C.clipIntersection,S.displacementMap=C.displacementMap,S.displacementScale=C.displacementScale,S.displacementBias=C.displacementBias,S.wireframeLinewidth=C.wireframeLinewidth,S.linewidth=C.linewidth,D.isPointLight===!0&&S.isMeshDistanceMaterial===!0){let V=i.properties.get(S);V.light=D}return S}function M(A,C,D,b,S){if(A.visible===!1)return;if(A.layers.test(C.layers)&&(A.isMesh||A.isLine||A.isPoints)&&(A.castShadow||A.receiveShadow&&S===Pn)&&(!A.frustumCulled||n.intersectsObject(A))){A.modelViewMatrix.multiplyMatrices(D.matrixWorldInverse,A.matrixWorld);let z=e.update(A),X=A.material;if(Array.isArray(X)){let J=z.groups;for(let q=0,te=J.length;q<te;q++){let W=J[q],se=X[W.materialIndex];if(se&&se.visible){let fe=w(A,se,b,S);A.onBeforeShadow(i,A,C,D,z,fe,W),i.renderBufferDirect(D,null,z,fe,A,W),A.onAfterShadow(i,A,C,D,z,fe,W)}}}else if(X.visible){let J=w(A,X,b,S);A.onBeforeShadow(i,A,C,D,z,J,null),i.renderBufferDirect(D,null,z,J,A,null),A.onAfterShadow(i,A,C,D,z,J,null)}}let V=A.children;for(let z=0,X=V.length;z<X;z++)M(V[z],C,D,b,S)}function N(A){A.target.removeEventListener("dispose",N);for(let D in c){let b=c[D],S=A.target.uuid;S in b&&(b[S].dispose(),delete b[S])}}}var P_={[hl]:dl,[pl]:xl,[ml]:_l,[sr]:gl,[dl]:hl,[xl]:pl,[_l]:ml,[gl]:sr};function I_(i,e){function t(){let P=!1,re=new ht,G=null,K=new ht(0,0,0,0);return{setMask:function(ue){G!==ue&&!P&&(i.colorMask(ue,ue,ue,ue),G=ue)},setLocked:function(ue){P=ue},setClear:function(ue,le,Le,ft,At){At===!0&&(ue*=ft,le*=ft,Le*=ft),re.set(ue,le,Le,ft),K.equals(re)===!1&&(i.clearColor(ue,le,Le,ft),K.copy(re))},reset:function(){P=!1,G=null,K.set(-1,0,0,0)}}}function n(){let P=!1,re=!1,G=null,K=null,ue=null;return{setReversed:function(le){if(re!==le){let Le=e.get("EXT_clip_control");re?Le.clipControlEXT(Le.LOWER_LEFT_EXT,Le.ZERO_TO_ONE_EXT):Le.clipControlEXT(Le.LOWER_LEFT_EXT,Le.NEGATIVE_ONE_TO_ONE_EXT);let ft=ue;ue=null,this.setClear(ft)}re=le},getReversed:function(){return re},setTest:function(le){le?ae(i.DEPTH_TEST):Ce(i.DEPTH_TEST)},setMask:function(le){G!==le&&!P&&(i.depthMask(le),G=le)},setFunc:function(le){if(re&&(le=P_[le]),K!==le){switch(le){case hl:i.depthFunc(i.NEVER);break;case dl:i.depthFunc(i.ALWAYS);break;case pl:i.depthFunc(i.LESS);break;case sr:i.depthFunc(i.LEQUAL);break;case ml:i.depthFunc(i.EQUAL);break;case gl:i.depthFunc(i.GEQUAL);break;case xl:i.depthFunc(i.GREATER);break;case _l:i.depthFunc(i.NOTEQUAL);break;default:i.depthFunc(i.LEQUAL)}K=le}},setLocked:function(le){P=le},setClear:function(le){ue!==le&&(re&&(le=1-le),i.clearDepth(le),ue=le)},reset:function(){P=!1,G=null,K=null,ue=null,re=!1}}}function r(){let P=!1,re=null,G=null,K=null,ue=null,le=null,Le=null,ft=null,At=null;return{setTest:function(Je){P||(Je?ae(i.STENCIL_TEST):Ce(i.STENCIL_TEST))},setMask:function(Je){re!==Je&&!P&&(i.stencilMask(Je),re=Je)},setFunc:function(Je,jt,vn){(G!==Je||K!==jt||ue!==vn)&&(i.stencilFunc(Je,jt,vn),G=Je,K=jt,ue=vn)},setOp:function(Je,jt,vn){(le!==Je||Le!==jt||ft!==vn)&&(i.stencilOp(Je,jt,vn),le=Je,Le=jt,ft=vn)},setLocked:function(Je){P=Je},setClear:function(Je){At!==Je&&(i.clearStencil(Je),At=Je)},reset:function(){P=!1,re=null,G=null,K=null,ue=null,le=null,Le=null,ft=null,At=null}}}let s=new t,a=new n,o=new r,l=new WeakMap,c=new WeakMap,u={},f={},d=new WeakMap,p=[],g=null,_=!1,m=null,h=null,T=null,w=null,M=null,N=null,A=null,C=new ze(0,0,0),D=0,b=!1,S=null,R=null,V=null,z=null,X=null,J=i.getParameter(i.MAX_COMBINED_TEXTURE_IMAGE_UNITS),q=!1,te=0,W=i.getParameter(i.VERSION);W.indexOf("WebGL")!==-1?(te=parseFloat(/^WebGL (\d)/.exec(W)[1]),q=te>=1):W.indexOf("OpenGL ES")!==-1&&(te=parseFloat(/^OpenGL ES (\d)/.exec(W)[1]),q=te>=2);let se=null,fe={},Me=i.getParameter(i.SCISSOR_BOX),Be=i.getParameter(i.VIEWPORT),tt=new ht().fromArray(Me),$=new ht().fromArray(Be);function ne(P,re,G,K){let ue=new Uint8Array(4),le=i.createTexture();i.bindTexture(P,le),i.texParameteri(P,i.TEXTURE_MIN_FILTER,i.NEAREST),i.texParameteri(P,i.TEXTURE_MAG_FILTER,i.NEAREST);for(let Le=0;Le<G;Le++)P===i.TEXTURE_3D||P===i.TEXTURE_2D_ARRAY?i.texImage3D(re,0,i.RGBA,1,1,K,0,i.RGBA,i.UNSIGNED_BYTE,ue):i.texImage2D(re+Le,0,i.RGBA,1,1,0,i.RGBA,i.UNSIGNED_BYTE,ue);return le}let _e={};_e[i.TEXTURE_2D]=ne(i.TEXTURE_2D,i.TEXTURE_2D,1),_e[i.TEXTURE_CUBE_MAP]=ne(i.TEXTURE_CUBE_MAP,i.TEXTURE_CUBE_MAP_POSITIVE_X,6),_e[i.TEXTURE_2D_ARRAY]=ne(i.TEXTURE_2D_ARRAY,i.TEXTURE_2D_ARRAY,1,1),_e[i.TEXTURE_3D]=ne(i.TEXTURE_3D,i.TEXTURE_3D,1,1),s.setClear(0,0,0,1),a.setClear(1),o.setClear(0),ae(i.DEPTH_TEST),a.setFunc(sr),Ve(!1),Ge(qu),ae(i.CULL_FACE),U(jn);function ae(P){u[P]!==!0&&(i.enable(P),u[P]=!0)}function Ce(P){u[P]!==!1&&(i.disable(P),u[P]=!1)}function Ie(P,re){return f[P]!==re?(i.bindFramebuffer(P,re),f[P]=re,P===i.DRAW_FRAMEBUFFER&&(f[i.FRAMEBUFFER]=re),P===i.FRAMEBUFFER&&(f[i.DRAW_FRAMEBUFFER]=re),!0):!1}function ke(P,re){let G=p,K=!1;if(P){G=d.get(re),G===void 0&&(G=[],d.set(re,G));let ue=P.textures;if(G.length!==ue.length||G[0]!==i.COLOR_ATTACHMENT0){for(let le=0,Le=ue.length;le<Le;le++)G[le]=i.COLOR_ATTACHMENT0+le;G.length=ue.length,K=!0}}else G[0]!==i.BACK&&(G[0]=i.BACK,K=!0);K&&i.drawBuffers(G)}function ut(P){return g!==P?(i.useProgram(P),g=P,!0):!1}let Xe={[di]:i.FUNC_ADD,[qd]:i.FUNC_SUBTRACT,[Yd]:i.FUNC_REVERSE_SUBTRACT};Xe[$d]=i.MIN,Xe[Zd]=i.MAX;let pt={[Kd]:i.ZERO,[Jd]:i.ONE,[jd]:i.SRC_COLOR,[ul]:i.SRC_ALPHA,[rp]:i.SRC_ALPHA_SATURATE,[np]:i.DST_COLOR,[ep]:i.DST_ALPHA,[Qd]:i.ONE_MINUS_SRC_COLOR,[fl]:i.ONE_MINUS_SRC_ALPHA,[ip]:i.ONE_MINUS_DST_COLOR,[tp]:i.ONE_MINUS_DST_ALPHA,[sp]:i.CONSTANT_COLOR,[ap]:i.ONE_MINUS_CONSTANT_COLOR,[op]:i.CONSTANT_ALPHA,[lp]:i.ONE_MINUS_CONSTANT_ALPHA};function U(P,re,G,K,ue,le,Le,ft,At,Je){if(P===jn){_===!0&&(Ce(i.BLEND),_=!1);return}if(_===!1&&(ae(i.BLEND),_=!0),P!==Xd){if(P!==m||Je!==b){if((h!==di||M!==di)&&(i.blendEquation(i.FUNC_ADD),h=di,M=di),Je)switch(P){case tr:i.blendFuncSeparate(i.ONE,i.ONE_MINUS_SRC_ALPHA,i.ONE,i.ONE_MINUS_SRC_ALPHA);break;case Yu:i.blendFunc(i.ONE,i.ONE);break;case $u:i.blendFuncSeparate(i.ZERO,i.ONE_MINUS_SRC_COLOR,i.ZERO,i.ONE);break;case Zu:i.blendFuncSeparate(i.ZERO,i.SRC_COLOR,i.ZERO,i.SRC_ALPHA);break;default:console.error("THREE.WebGLState: Invalid blending: ",P);break}else switch(P){case tr:i.blendFuncSeparate(i.SRC_ALPHA,i.ONE_MINUS_SRC_ALPHA,i.ONE,i.ONE_MINUS_SRC_ALPHA);break;case Yu:i.blendFunc(i.SRC_ALPHA,i.ONE);break;case $u:i.blendFuncSeparate(i.ZERO,i.ONE_MINUS_SRC_COLOR,i.ZERO,i.ONE);break;case Zu:i.blendFunc(i.ZERO,i.SRC_COLOR);break;default:console.error("THREE.WebGLState: Invalid blending: ",P);break}T=null,w=null,N=null,A=null,C.set(0,0,0),D=0,m=P,b=Je}return}ue=ue||re,le=le||G,Le=Le||K,(re!==h||ue!==M)&&(i.blendEquationSeparate(Xe[re],Xe[ue]),h=re,M=ue),(G!==T||K!==w||le!==N||Le!==A)&&(i.blendFuncSeparate(pt[G],pt[K],pt[le],pt[Le]),T=G,w=K,N=le,A=Le),(ft.equals(C)===!1||At!==D)&&(i.blendColor(ft.r,ft.g,ft.b,At),C.copy(ft),D=At),m=P,b=!1}function Xt(P,re){P.side===In?Ce(i.CULL_FACE):ae(i.CULL_FACE);let G=P.side===Ot;re&&(G=!G),Ve(G),P.blending===tr&&P.transparent===!1?U(jn):U(P.blending,P.blendEquation,P.blendSrc,P.blendDst,P.blendEquationAlpha,P.blendSrcAlpha,P.blendDstAlpha,P.blendColor,P.blendAlpha,P.premultipliedAlpha),a.setFunc(P.depthFunc),a.setTest(P.depthTest),a.setMask(P.depthWrite),s.setMask(P.colorWrite);let K=P.stencilWrite;o.setTest(K),K&&(o.setMask(P.stencilWriteMask),o.setFunc(P.stencilFunc,P.stencilRef,P.stencilFuncMask),o.setOp(P.stencilFail,P.stencilZFail,P.stencilZPass)),st(P.polygonOffset,P.polygonOffsetFactor,P.polygonOffsetUnits),P.alphaToCoverage===!0?ae(i.SAMPLE_ALPHA_TO_COVERAGE):Ce(i.SAMPLE_ALPHA_TO_COVERAGE)}function Ve(P){S!==P&&(P?i.frontFace(i.CW):i.frontFace(i.CCW),S=P)}function Ge(P){P!==Gd?(ae(i.CULL_FACE),P!==R&&(P===qu?i.cullFace(i.BACK):P===Wd?i.cullFace(i.FRONT):i.cullFace(i.FRONT_AND_BACK))):Ce(i.CULL_FACE),R=P}function Ee(P){P!==V&&(q&&i.lineWidth(P),V=P)}function st(P,re,G){P?(ae(i.POLYGON_OFFSET_FILL),(z!==re||X!==G)&&(i.polygonOffset(re,G),z=re,X=G)):Ce(i.POLYGON_OFFSET_FILL)}function be(P){P?ae(i.SCISSOR_TEST):Ce(i.SCISSOR_TEST)}function E(P){P===void 0&&(P=i.TEXTURE0+J-1),se!==P&&(i.activeTexture(P),se=P)}function x(P,re,G){G===void 0&&(se===null?G=i.TEXTURE0+J-1:G=se);let K=fe[G];K===void 0&&(K={type:void 0,texture:void 0},fe[G]=K),(K.type!==P||K.texture!==re)&&(se!==G&&(i.activeTexture(G),se=G),i.bindTexture(P,re||_e[P]),K.type=P,K.texture=re)}function F(){let P=fe[se];P!==void 0&&P.type!==void 0&&(i.bindTexture(P.type,null),P.type=void 0,P.texture=void 0)}function Z(){try{i.compressedTexImage2D.apply(i,arguments)}catch(P){console.error("THREE.WebGLState:",P)}}function j(){try{i.compressedTexImage3D.apply(i,arguments)}catch(P){console.error("THREE.WebGLState:",P)}}function Y(){try{i.texSubImage2D.apply(i,arguments)}catch(P){console.error("THREE.WebGLState:",P)}}function ve(){try{i.texSubImage3D.apply(i,arguments)}catch(P){console.error("THREE.WebGLState:",P)}}function oe(){try{i.compressedTexSubImage2D.apply(i,arguments)}catch(P){console.error("THREE.WebGLState:",P)}}function he(){try{i.compressedTexSubImage3D.apply(i,arguments)}catch(P){console.error("THREE.WebGLState:",P)}}function qe(){try{i.texStorage2D.apply(i,arguments)}catch(P){console.error("THREE.WebGLState:",P)}}function Q(){try{i.texStorage3D.apply(i,arguments)}catch(P){console.error("THREE.WebGLState:",P)}}function de(){try{i.texImage2D.apply(i,arguments)}catch(P){console.error("THREE.WebGLState:",P)}}function Ae(){try{i.texImage3D.apply(i,arguments)}catch(P){console.error("THREE.WebGLState:",P)}}function Re(P){tt.equals(P)===!1&&(i.scissor(P.x,P.y,P.z,P.w),tt.copy(P))}function pe(P){$.equals(P)===!1&&(i.viewport(P.x,P.y,P.z,P.w),$.copy(P))}function We(P,re){let G=c.get(re);G===void 0&&(G=new WeakMap,c.set(re,G));let K=G.get(P);K===void 0&&(K=i.getUniformBlockIndex(re,P.name),G.set(P,K))}function Oe(P,re){let K=c.get(re).get(P);l.get(re)!==K&&(i.uniformBlockBinding(re,K,P.__bindingPointIndex),l.set(re,K))}function nt(){i.disable(i.BLEND),i.disable(i.CULL_FACE),i.disable(i.DEPTH_TEST),i.disable(i.POLYGON_OFFSET_FILL),i.disable(i.SCISSOR_TEST),i.disable(i.STENCIL_TEST),i.disable(i.SAMPLE_ALPHA_TO_COVERAGE),i.blendEquation(i.FUNC_ADD),i.blendFunc(i.ONE,i.ZERO),i.blendFuncSeparate(i.ONE,i.ZERO,i.ONE,i.ZERO),i.blendColor(0,0,0,0),i.colorMask(!0,!0,!0,!0),i.clearColor(0,0,0,0),i.depthMask(!0),i.depthFunc(i.LESS),a.setReversed(!1),i.clearDepth(1),i.stencilMask(4294967295),i.stencilFunc(i.ALWAYS,0,4294967295),i.stencilOp(i.KEEP,i.KEEP,i.KEEP),i.clearStencil(0),i.cullFace(i.BACK),i.frontFace(i.CCW),i.polygonOffset(0,0),i.activeTexture(i.TEXTURE0),i.bindFramebuffer(i.FRAMEBUFFER,null),i.bindFramebuffer(i.DRAW_FRAMEBUFFER,null),i.bindFramebuffer(i.READ_FRAMEBUFFER,null),i.useProgram(null),i.lineWidth(1),i.scissor(0,0,i.canvas.width,i.canvas.height),i.viewport(0,0,i.canvas.width,i.canvas.height),u={},se=null,fe={},f={},d=new WeakMap,p=[],g=null,_=!1,m=null,h=null,T=null,w=null,M=null,N=null,A=null,C=new ze(0,0,0),D=0,b=!1,S=null,R=null,V=null,z=null,X=null,tt.set(0,0,i.canvas.width,i.canvas.height),$.set(0,0,i.canvas.width,i.canvas.height),s.reset(),a.reset(),o.reset()}return{buffers:{color:s,depth:a,stencil:o},enable:ae,disable:Ce,bindFramebuffer:Ie,drawBuffers:ke,useProgram:ut,setBlending:U,setMaterial:Xt,setFlipSided:Ve,setCullFace:Ge,setLineWidth:Ee,setPolygonOffset:st,setScissorTest:be,activeTexture:E,bindTexture:x,unbindTexture:F,compressedTexImage2D:Z,compressedTexImage3D:j,texImage2D:de,texImage3D:Ae,updateUBOMapping:We,uniformBlockBinding:Oe,texStorage2D:qe,texStorage3D:Q,texSubImage2D:Y,texSubImage3D:ve,compressedTexSubImage2D:oe,compressedTexSubImage3D:he,scissor:Re,viewport:pe,reset:nt}}function Yf(i,e,t,n){let r=L_(n);switch(t){case sh:return i*e;case oh:return i*e;case lh:return i*e*2;case ch:return i*e/r.components*r.byteLength;case Pc:return i*e/r.components*r.byteLength;case uh:return i*e*2/r.components*r.byteLength;case Ic:return i*e*2/r.components*r.byteLength;case ah:return i*e*3/r.components*r.byteLength;case an:return i*e*4/r.components*r.byteLength;case Lc:return i*e*4/r.components*r.byteLength;case zs:case Hs:return Math.floor((i+3)/4)*Math.floor((e+3)/4)*8;case Vs:case Gs:return Math.floor((i+3)/4)*Math.floor((e+3)/4)*16;case wl:case Tl:return Math.max(i,16)*Math.max(e,8)/4;case bl:case El:return Math.max(i,8)*Math.max(e,8)/2;case Al:case Cl:return Math.floor((i+3)/4)*Math.floor((e+3)/4)*8;case Rl:return Math.floor((i+3)/4)*Math.floor((e+3)/4)*16;case Pl:return Math.floor((i+3)/4)*Math.floor((e+3)/4)*16;case Il:return Math.floor((i+4)/5)*Math.floor((e+3)/4)*16;case Ll:return Math.floor((i+4)/5)*Math.floor((e+4)/5)*16;case Dl:return Math.floor((i+5)/6)*Math.floor((e+4)/5)*16;case Ul:return Math.floor((i+5)/6)*Math.floor((e+5)/6)*16;case Nl:return Math.floor((i+7)/8)*Math.floor((e+4)/5)*16;case Ol:return Math.floor((i+7)/8)*Math.floor((e+5)/6)*16;case Fl:return Math.floor((i+7)/8)*Math.floor((e+7)/8)*16;case Bl:return Math.floor((i+9)/10)*Math.floor((e+4)/5)*16;case kl:return Math.floor((i+9)/10)*Math.floor((e+5)/6)*16;case zl:return Math.floor((i+9)/10)*Math.floor((e+7)/8)*16;case Hl:return Math.floor((i+9)/10)*Math.floor((e+9)/10)*16;case Vl:return Math.floor((i+11)/12)*Math.floor((e+9)/10)*16;case Gl:return Math.floor((i+11)/12)*Math.floor((e+11)/12)*16;case Ws:case Wl:case Xl:return Math.ceil(i/4)*Math.ceil(e/4)*16;case fh:case ql:return Math.ceil(i/4)*Math.ceil(e/4)*8;case Yl:case $l:return Math.ceil(i/4)*Math.ceil(e/4)*16}throw new Error(`Unable to determine texture byte length for ${t} format.`)}function L_(i){switch(i){case Nn:case nh:return{byteLength:1,components:1};case Hr:case ih:case $r:return{byteLength:2,components:1};case Cc:case Rc:return{byteLength:2,components:4};case _i:case Ac:case Ln:return{byteLength:4,components:1};case rh:return{byteLength:4,components:3}}throw new Error(`Unknown texture type ${i}.`)}function D_(i,e,t,n,r,s,a){let o=e.has("WEBGL_multisampled_render_to_texture")?e.get("WEBGL_multisampled_render_to_texture"):null,l=typeof navigator>"u"?!1:/OculusBrowser/g.test(navigator.userAgent),c=new we,u=new WeakMap,f,d=new WeakMap,p=!1;try{p=typeof OffscreenCanvas<"u"&&new OffscreenCanvas(1,1).getContext("2d")!==null}catch{}function g(E,x){return p?new OffscreenCanvas(E,x):Ys("canvas")}function _(E,x,F){let Z=1,j=be(E);if((j.width>F||j.height>F)&&(Z=F/Math.max(j.width,j.height)),Z<1)if(typeof HTMLImageElement<"u"&&E instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&E instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&E instanceof ImageBitmap||typeof VideoFrame<"u"&&E instanceof VideoFrame){let Y=Math.floor(Z*j.width),ve=Math.floor(Z*j.height);f===void 0&&(f=g(Y,ve));let oe=x?g(Y,ve):f;return oe.width=Y,oe.height=ve,oe.getContext("2d").drawImage(E,0,0,Y,ve),console.warn("THREE.WebGLRenderer: Texture has been resized from ("+j.width+"x"+j.height+") to ("+Y+"x"+ve+")."),oe}else return"data"in E&&console.warn("THREE.WebGLRenderer: Image in DataTexture is too big ("+j.width+"x"+j.height+")."),E;return E}function m(E){return E.generateMipmaps}function h(E){i.generateMipmap(E)}function T(E){return E.isWebGLCubeRenderTarget?i.TEXTURE_CUBE_MAP:E.isWebGL3DRenderTarget?i.TEXTURE_3D:E.isWebGLArrayRenderTarget||E.isCompressedArrayTexture?i.TEXTURE_2D_ARRAY:i.TEXTURE_2D}function w(E,x,F,Z,j=!1){if(E!==null){if(i[E]!==void 0)return i[E];console.warn("THREE.WebGLRenderer: Attempt to use non-existing WebGL internal format '"+E+"'")}let Y=x;if(x===i.RED&&(F===i.FLOAT&&(Y=i.R32F),F===i.HALF_FLOAT&&(Y=i.R16F),F===i.UNSIGNED_BYTE&&(Y=i.R8)),x===i.RED_INTEGER&&(F===i.UNSIGNED_BYTE&&(Y=i.R8UI),F===i.UNSIGNED_SHORT&&(Y=i.R16UI),F===i.UNSIGNED_INT&&(Y=i.R32UI),F===i.BYTE&&(Y=i.R8I),F===i.SHORT&&(Y=i.R16I),F===i.INT&&(Y=i.R32I)),x===i.RG&&(F===i.FLOAT&&(Y=i.RG32F),F===i.HALF_FLOAT&&(Y=i.RG16F),F===i.UNSIGNED_BYTE&&(Y=i.RG8)),x===i.RG_INTEGER&&(F===i.UNSIGNED_BYTE&&(Y=i.RG8UI),F===i.UNSIGNED_SHORT&&(Y=i.RG16UI),F===i.UNSIGNED_INT&&(Y=i.RG32UI),F===i.BYTE&&(Y=i.RG8I),F===i.SHORT&&(Y=i.RG16I),F===i.INT&&(Y=i.RG32I)),x===i.RGB_INTEGER&&(F===i.UNSIGNED_BYTE&&(Y=i.RGB8UI),F===i.UNSIGNED_SHORT&&(Y=i.RGB16UI),F===i.UNSIGNED_INT&&(Y=i.RGB32UI),F===i.BYTE&&(Y=i.RGB8I),F===i.SHORT&&(Y=i.RGB16I),F===i.INT&&(Y=i.RGB32I)),x===i.RGBA_INTEGER&&(F===i.UNSIGNED_BYTE&&(Y=i.RGBA8UI),F===i.UNSIGNED_SHORT&&(Y=i.RGBA16UI),F===i.UNSIGNED_INT&&(Y=i.RGBA32UI),F===i.BYTE&&(Y=i.RGBA8I),F===i.SHORT&&(Y=i.RGBA16I),F===i.INT&&(Y=i.RGBA32I)),x===i.RGB&&F===i.UNSIGNED_INT_5_9_9_9_REV&&(Y=i.RGB9_E5),x===i.RGBA){let ve=j?ga:Ye.getTransfer(Z);F===i.FLOAT&&(Y=i.RGBA32F),F===i.HALF_FLOAT&&(Y=i.RGBA16F),F===i.UNSIGNED_BYTE&&(Y=ve===je?i.SRGB8_ALPHA8:i.RGBA8),F===i.UNSIGNED_SHORT_4_4_4_4&&(Y=i.RGBA4),F===i.UNSIGNED_SHORT_5_5_5_1&&(Y=i.RGB5_A1)}return(Y===i.R16F||Y===i.R32F||Y===i.RG16F||Y===i.RG32F||Y===i.RGBA16F||Y===i.RGBA32F)&&e.get("EXT_color_buffer_float"),Y}function M(E,x){let F;return E?x===null||x===_i||x===lr?F=i.DEPTH24_STENCIL8:x===Ln?F=i.DEPTH32F_STENCIL8:x===Hr&&(F=i.DEPTH24_STENCIL8,console.warn("DepthTexture: 16 bit depth attachment is not supported with stencil. Using 24-bit attachment.")):x===null||x===_i||x===lr?F=i.DEPTH_COMPONENT24:x===Ln?F=i.DEPTH_COMPONENT32F:x===Hr&&(F=i.DEPTH_COMPONENT16),F}function N(E,x){return m(E)===!0||E.isFramebufferTexture&&E.minFilter!==on&&E.minFilter!==mn?Math.log2(Math.max(x.width,x.height))+1:E.mipmaps!==void 0&&E.mipmaps.length>0?E.mipmaps.length:E.isCompressedTexture&&Array.isArray(E.image)?x.mipmaps.length:1}function A(E){let x=E.target;x.removeEventListener("dispose",A),D(x),x.isVideoTexture&&u.delete(x)}function C(E){let x=E.target;x.removeEventListener("dispose",C),S(x)}function D(E){let x=n.get(E);if(x.__webglInit===void 0)return;let F=E.source,Z=d.get(F);if(Z){let j=Z[x.__cacheKey];j.usedTimes--,j.usedTimes===0&&b(E),Object.keys(Z).length===0&&d.delete(F)}n.remove(E)}function b(E){let x=n.get(E);i.deleteTexture(x.__webglTexture);let F=E.source,Z=d.get(F);delete Z[x.__cacheKey],a.memory.textures--}function S(E){let x=n.get(E);if(E.depthTexture&&(E.depthTexture.dispose(),n.remove(E.depthTexture)),E.isWebGLCubeRenderTarget)for(let Z=0;Z<6;Z++){if(Array.isArray(x.__webglFramebuffer[Z]))for(let j=0;j<x.__webglFramebuffer[Z].length;j++)i.deleteFramebuffer(x.__webglFramebuffer[Z][j]);else i.deleteFramebuffer(x.__webglFramebuffer[Z]);x.__webglDepthbuffer&&i.deleteRenderbuffer(x.__webglDepthbuffer[Z])}else{if(Array.isArray(x.__webglFramebuffer))for(let Z=0;Z<x.__webglFramebuffer.length;Z++)i.deleteFramebuffer(x.__webglFramebuffer[Z]);else i.deleteFramebuffer(x.__webglFramebuffer);if(x.__webglDepthbuffer&&i.deleteRenderbuffer(x.__webglDepthbuffer),x.__webglMultisampledFramebuffer&&i.deleteFramebuffer(x.__webglMultisampledFramebuffer),x.__webglColorRenderbuffer)for(let Z=0;Z<x.__webglColorRenderbuffer.length;Z++)x.__webglColorRenderbuffer[Z]&&i.deleteRenderbuffer(x.__webglColorRenderbuffer[Z]);x.__webglDepthRenderbuffer&&i.deleteRenderbuffer(x.__webglDepthRenderbuffer)}let F=E.textures;for(let Z=0,j=F.length;Z<j;Z++){let Y=n.get(F[Z]);Y.__webglTexture&&(i.deleteTexture(Y.__webglTexture),a.memory.textures--),n.remove(F[Z])}n.remove(E)}let R=0;function V(){R=0}function z(){let E=R;return E>=r.maxTextures&&console.warn("THREE.WebGLTextures: Trying to use "+E+" texture units while this GPU supports only "+r.maxTextures),R+=1,E}function X(E){let x=[];return x.push(E.wrapS),x.push(E.wrapT),x.push(E.wrapR||0),x.push(E.magFilter),x.push(E.minFilter),x.push(E.anisotropy),x.push(E.internalFormat),x.push(E.format),x.push(E.type),x.push(E.generateMipmaps),x.push(E.premultiplyAlpha),x.push(E.flipY),x.push(E.unpackAlignment),x.push(E.colorSpace),x.join()}function J(E,x){let F=n.get(E);if(E.isVideoTexture&&Ee(E),E.isRenderTargetTexture===!1&&E.version>0&&F.__version!==E.version){let Z=E.image;if(Z===null)console.warn("THREE.WebGLRenderer: Texture marked for update but no image data found.");else if(Z.complete===!1)console.warn("THREE.WebGLRenderer: Texture marked for update but image is incomplete");else{$(F,E,x);return}}t.bindTexture(i.TEXTURE_2D,F.__webglTexture,i.TEXTURE0+x)}function q(E,x){let F=n.get(E);if(E.version>0&&F.__version!==E.version){$(F,E,x);return}t.bindTexture(i.TEXTURE_2D_ARRAY,F.__webglTexture,i.TEXTURE0+x)}function te(E,x){let F=n.get(E);if(E.version>0&&F.__version!==E.version){$(F,E,x);return}t.bindTexture(i.TEXTURE_3D,F.__webglTexture,i.TEXTURE0+x)}function W(E,x){let F=n.get(E);if(E.version>0&&F.__version!==E.version){ne(F,E,x);return}t.bindTexture(i.TEXTURE_CUBE_MAP,F.__webglTexture,i.TEXTURE0+x)}let se={[Sl]:i.REPEAT,[gi]:i.CLAMP_TO_EDGE,[Ml]:i.MIRRORED_REPEAT},fe={[on]:i.NEAREST,[xp]:i.NEAREST_MIPMAP_NEAREST,[_s]:i.NEAREST_MIPMAP_LINEAR,[mn]:i.LINEAR,[No]:i.LINEAR_MIPMAP_NEAREST,[xi]:i.LINEAR_MIPMAP_LINEAR},Me={[Sp]:i.NEVER,[Ap]:i.ALWAYS,[Mp]:i.LESS,[dh]:i.LEQUAL,[bp]:i.EQUAL,[Tp]:i.GEQUAL,[wp]:i.GREATER,[Ep]:i.NOTEQUAL};function Be(E,x){if(x.type===Ln&&e.has("OES_texture_float_linear")===!1&&(x.magFilter===mn||x.magFilter===No||x.magFilter===_s||x.magFilter===xi||x.minFilter===mn||x.minFilter===No||x.minFilter===_s||x.minFilter===xi)&&console.warn("THREE.WebGLRenderer: Unable to use linear filtering with floating point textures. OES_texture_float_linear not supported on this device."),i.texParameteri(E,i.TEXTURE_WRAP_S,se[x.wrapS]),i.texParameteri(E,i.TEXTURE_WRAP_T,se[x.wrapT]),(E===i.TEXTURE_3D||E===i.TEXTURE_2D_ARRAY)&&i.texParameteri(E,i.TEXTURE_WRAP_R,se[x.wrapR]),i.texParameteri(E,i.TEXTURE_MAG_FILTER,fe[x.magFilter]),i.texParameteri(E,i.TEXTURE_MIN_FILTER,fe[x.minFilter]),x.compareFunction&&(i.texParameteri(E,i.TEXTURE_COMPARE_MODE,i.COMPARE_REF_TO_TEXTURE),i.texParameteri(E,i.TEXTURE_COMPARE_FUNC,Me[x.compareFunction])),e.has("EXT_texture_filter_anisotropic")===!0){if(x.magFilter===on||x.minFilter!==_s&&x.minFilter!==xi||x.type===Ln&&e.has("OES_texture_float_linear")===!1)return;if(x.anisotropy>1||n.get(x).__currentAnisotropy){let F=e.get("EXT_texture_filter_anisotropic");i.texParameterf(E,F.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(x.anisotropy,r.getMaxAnisotropy())),n.get(x).__currentAnisotropy=x.anisotropy}}}function tt(E,x){let F=!1;E.__webglInit===void 0&&(E.__webglInit=!0,x.addEventListener("dispose",A));let Z=x.source,j=d.get(Z);j===void 0&&(j={},d.set(Z,j));let Y=X(x);if(Y!==E.__cacheKey){j[Y]===void 0&&(j[Y]={texture:i.createTexture(),usedTimes:0},a.memory.textures++,F=!0),j[Y].usedTimes++;let ve=j[E.__cacheKey];ve!==void 0&&(j[E.__cacheKey].usedTimes--,ve.usedTimes===0&&b(x)),E.__cacheKey=Y,E.__webglTexture=j[Y].texture}return F}function $(E,x,F){let Z=i.TEXTURE_2D;(x.isDataArrayTexture||x.isCompressedArrayTexture)&&(Z=i.TEXTURE_2D_ARRAY),x.isData3DTexture&&(Z=i.TEXTURE_3D);let j=tt(E,x),Y=x.source;t.bindTexture(Z,E.__webglTexture,i.TEXTURE0+F);let ve=n.get(Y);if(Y.version!==ve.__version||j===!0){t.activeTexture(i.TEXTURE0+F);let oe=Ye.getPrimaries(Ye.workingColorSpace),he=x.colorSpace===Jn?null:Ye.getPrimaries(x.colorSpace),qe=x.colorSpace===Jn||oe===he?i.NONE:i.BROWSER_DEFAULT_WEBGL;i.pixelStorei(i.UNPACK_FLIP_Y_WEBGL,x.flipY),i.pixelStorei(i.UNPACK_PREMULTIPLY_ALPHA_WEBGL,x.premultiplyAlpha),i.pixelStorei(i.UNPACK_ALIGNMENT,x.unpackAlignment),i.pixelStorei(i.UNPACK_COLORSPACE_CONVERSION_WEBGL,qe);let Q=_(x.image,!1,r.maxTextureSize);Q=st(x,Q);let de=s.convert(x.format,x.colorSpace),Ae=s.convert(x.type),Re=w(x.internalFormat,de,Ae,x.colorSpace,x.isVideoTexture);Be(Z,x);let pe,We=x.mipmaps,Oe=x.isVideoTexture!==!0,nt=ve.__version===void 0||j===!0,P=Y.dataReady,re=N(x,Q);if(x.isDepthTexture)Re=M(x.format===cr,x.type),nt&&(Oe?t.texStorage2D(i.TEXTURE_2D,1,Re,Q.width,Q.height):t.texImage2D(i.TEXTURE_2D,0,Re,Q.width,Q.height,0,de,Ae,null));else if(x.isDataTexture)if(We.length>0){Oe&&nt&&t.texStorage2D(i.TEXTURE_2D,re,Re,We[0].width,We[0].height);for(let G=0,K=We.length;G<K;G++)pe=We[G],Oe?P&&t.texSubImage2D(i.TEXTURE_2D,G,0,0,pe.width,pe.height,de,Ae,pe.data):t.texImage2D(i.TEXTURE_2D,G,Re,pe.width,pe.height,0,de,Ae,pe.data);x.generateMipmaps=!1}else Oe?(nt&&t.texStorage2D(i.TEXTURE_2D,re,Re,Q.width,Q.height),P&&t.texSubImage2D(i.TEXTURE_2D,0,0,0,Q.width,Q.height,de,Ae,Q.data)):t.texImage2D(i.TEXTURE_2D,0,Re,Q.width,Q.height,0,de,Ae,Q.data);else if(x.isCompressedTexture)if(x.isCompressedArrayTexture){Oe&&nt&&t.texStorage3D(i.TEXTURE_2D_ARRAY,re,Re,We[0].width,We[0].height,Q.depth);for(let G=0,K=We.length;G<K;G++)if(pe=We[G],x.format!==an)if(de!==null)if(Oe){if(P)if(x.layerUpdates.size>0){let ue=Yf(pe.width,pe.height,x.format,x.type);for(let le of x.layerUpdates){let Le=pe.data.subarray(le*ue/pe.data.BYTES_PER_ELEMENT,(le+1)*ue/pe.data.BYTES_PER_ELEMENT);t.compressedTexSubImage3D(i.TEXTURE_2D_ARRAY,G,0,0,le,pe.width,pe.height,1,de,Le)}x.clearLayerUpdates()}else t.compressedTexSubImage3D(i.TEXTURE_2D_ARRAY,G,0,0,0,pe.width,pe.height,Q.depth,de,pe.data)}else t.compressedTexImage3D(i.TEXTURE_2D_ARRAY,G,Re,pe.width,pe.height,Q.depth,0,pe.data,0,0);else console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()");else Oe?P&&t.texSubImage3D(i.TEXTURE_2D_ARRAY,G,0,0,0,pe.width,pe.height,Q.depth,de,Ae,pe.data):t.texImage3D(i.TEXTURE_2D_ARRAY,G,Re,pe.width,pe.height,Q.depth,0,de,Ae,pe.data)}else{Oe&&nt&&t.texStorage2D(i.TEXTURE_2D,re,Re,We[0].width,We[0].height);for(let G=0,K=We.length;G<K;G++)pe=We[G],x.format!==an?de!==null?Oe?P&&t.compressedTexSubImage2D(i.TEXTURE_2D,G,0,0,pe.width,pe.height,de,pe.data):t.compressedTexImage2D(i.TEXTURE_2D,G,Re,pe.width,pe.height,0,pe.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):Oe?P&&t.texSubImage2D(i.TEXTURE_2D,G,0,0,pe.width,pe.height,de,Ae,pe.data):t.texImage2D(i.TEXTURE_2D,G,Re,pe.width,pe.height,0,de,Ae,pe.data)}else if(x.isDataArrayTexture)if(Oe){if(nt&&t.texStorage3D(i.TEXTURE_2D_ARRAY,re,Re,Q.width,Q.height,Q.depth),P)if(x.layerUpdates.size>0){let G=Yf(Q.width,Q.height,x.format,x.type);for(let K of x.layerUpdates){let ue=Q.data.subarray(K*G/Q.data.BYTES_PER_ELEMENT,(K+1)*G/Q.data.BYTES_PER_ELEMENT);t.texSubImage3D(i.TEXTURE_2D_ARRAY,0,0,0,K,Q.width,Q.height,1,de,Ae,ue)}x.clearLayerUpdates()}else t.texSubImage3D(i.TEXTURE_2D_ARRAY,0,0,0,0,Q.width,Q.height,Q.depth,de,Ae,Q.data)}else t.texImage3D(i.TEXTURE_2D_ARRAY,0,Re,Q.width,Q.height,Q.depth,0,de,Ae,Q.data);else if(x.isData3DTexture)Oe?(nt&&t.texStorage3D(i.TEXTURE_3D,re,Re,Q.width,Q.height,Q.depth),P&&t.texSubImage3D(i.TEXTURE_3D,0,0,0,0,Q.width,Q.height,Q.depth,de,Ae,Q.data)):t.texImage3D(i.TEXTURE_3D,0,Re,Q.width,Q.height,Q.depth,0,de,Ae,Q.data);else if(x.isFramebufferTexture){if(nt)if(Oe)t.texStorage2D(i.TEXTURE_2D,re,Re,Q.width,Q.height);else{let G=Q.width,K=Q.height;for(let ue=0;ue<re;ue++)t.texImage2D(i.TEXTURE_2D,ue,Re,G,K,0,de,Ae,null),G>>=1,K>>=1}}else if(We.length>0){if(Oe&&nt){let G=be(We[0]);t.texStorage2D(i.TEXTURE_2D,re,Re,G.width,G.height)}for(let G=0,K=We.length;G<K;G++)pe=We[G],Oe?P&&t.texSubImage2D(i.TEXTURE_2D,G,0,0,de,Ae,pe):t.texImage2D(i.TEXTURE_2D,G,Re,de,Ae,pe);x.generateMipmaps=!1}else if(Oe){if(nt){let G=be(Q);t.texStorage2D(i.TEXTURE_2D,re,Re,G.width,G.height)}P&&t.texSubImage2D(i.TEXTURE_2D,0,0,0,de,Ae,Q)}else t.texImage2D(i.TEXTURE_2D,0,Re,de,Ae,Q);m(x)&&h(Z),ve.__version=Y.version,x.onUpdate&&x.onUpdate(x)}E.__version=x.version}function ne(E,x,F){if(x.image.length!==6)return;let Z=tt(E,x),j=x.source;t.bindTexture(i.TEXTURE_CUBE_MAP,E.__webglTexture,i.TEXTURE0+F);let Y=n.get(j);if(j.version!==Y.__version||Z===!0){t.activeTexture(i.TEXTURE0+F);let ve=Ye.getPrimaries(Ye.workingColorSpace),oe=x.colorSpace===Jn?null:Ye.getPrimaries(x.colorSpace),he=x.colorSpace===Jn||ve===oe?i.NONE:i.BROWSER_DEFAULT_WEBGL;i.pixelStorei(i.UNPACK_FLIP_Y_WEBGL,x.flipY),i.pixelStorei(i.UNPACK_PREMULTIPLY_ALPHA_WEBGL,x.premultiplyAlpha),i.pixelStorei(i.UNPACK_ALIGNMENT,x.unpackAlignment),i.pixelStorei(i.UNPACK_COLORSPACE_CONVERSION_WEBGL,he);let qe=x.isCompressedTexture||x.image[0].isCompressedTexture,Q=x.image[0]&&x.image[0].isDataTexture,de=[];for(let K=0;K<6;K++)!qe&&!Q?de[K]=_(x.image[K],!0,r.maxCubemapSize):de[K]=Q?x.image[K].image:x.image[K],de[K]=st(x,de[K]);let Ae=de[0],Re=s.convert(x.format,x.colorSpace),pe=s.convert(x.type),We=w(x.internalFormat,Re,pe,x.colorSpace),Oe=x.isVideoTexture!==!0,nt=Y.__version===void 0||Z===!0,P=j.dataReady,re=N(x,Ae);Be(i.TEXTURE_CUBE_MAP,x);let G;if(qe){Oe&&nt&&t.texStorage2D(i.TEXTURE_CUBE_MAP,re,We,Ae.width,Ae.height);for(let K=0;K<6;K++){G=de[K].mipmaps;for(let ue=0;ue<G.length;ue++){let le=G[ue];x.format!==an?Re!==null?Oe?P&&t.compressedTexSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+K,ue,0,0,le.width,le.height,Re,le.data):t.compressedTexImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+K,ue,We,le.width,le.height,0,le.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()"):Oe?P&&t.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+K,ue,0,0,le.width,le.height,Re,pe,le.data):t.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+K,ue,We,le.width,le.height,0,Re,pe,le.data)}}}else{if(G=x.mipmaps,Oe&&nt){G.length>0&&re++;let K=be(de[0]);t.texStorage2D(i.TEXTURE_CUBE_MAP,re,We,K.width,K.height)}for(let K=0;K<6;K++)if(Q){Oe?P&&t.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+K,0,0,0,de[K].width,de[K].height,Re,pe,de[K].data):t.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+K,0,We,de[K].width,de[K].height,0,Re,pe,de[K].data);for(let ue=0;ue<G.length;ue++){let Le=G[ue].image[K].image;Oe?P&&t.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+K,ue+1,0,0,Le.width,Le.height,Re,pe,Le.data):t.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+K,ue+1,We,Le.width,Le.height,0,Re,pe,Le.data)}}else{Oe?P&&t.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+K,0,0,0,Re,pe,de[K]):t.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+K,0,We,Re,pe,de[K]);for(let ue=0;ue<G.length;ue++){let le=G[ue];Oe?P&&t.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+K,ue+1,0,0,Re,pe,le.image[K]):t.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+K,ue+1,We,Re,pe,le.image[K])}}}m(x)&&h(i.TEXTURE_CUBE_MAP),Y.__version=j.version,x.onUpdate&&x.onUpdate(x)}E.__version=x.version}function _e(E,x,F,Z,j,Y){let ve=s.convert(F.format,F.colorSpace),oe=s.convert(F.type),he=w(F.internalFormat,ve,oe,F.colorSpace),qe=n.get(x),Q=n.get(F);if(Q.__renderTarget=x,!qe.__hasExternalTextures){let de=Math.max(1,x.width>>Y),Ae=Math.max(1,x.height>>Y);j===i.TEXTURE_3D||j===i.TEXTURE_2D_ARRAY?t.texImage3D(j,Y,he,de,Ae,x.depth,0,ve,oe,null):t.texImage2D(j,Y,he,de,Ae,0,ve,oe,null)}t.bindFramebuffer(i.FRAMEBUFFER,E),Ge(x)?o.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,Z,j,Q.__webglTexture,0,Ve(x)):(j===i.TEXTURE_2D||j>=i.TEXTURE_CUBE_MAP_POSITIVE_X&&j<=i.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&i.framebufferTexture2D(i.FRAMEBUFFER,Z,j,Q.__webglTexture,Y),t.bindFramebuffer(i.FRAMEBUFFER,null)}function ae(E,x,F){if(i.bindRenderbuffer(i.RENDERBUFFER,E),x.depthBuffer){let Z=x.depthTexture,j=Z&&Z.isDepthTexture?Z.type:null,Y=M(x.stencilBuffer,j),ve=x.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,oe=Ve(x);Ge(x)?o.renderbufferStorageMultisampleEXT(i.RENDERBUFFER,oe,Y,x.width,x.height):F?i.renderbufferStorageMultisample(i.RENDERBUFFER,oe,Y,x.width,x.height):i.renderbufferStorage(i.RENDERBUFFER,Y,x.width,x.height),i.framebufferRenderbuffer(i.FRAMEBUFFER,ve,i.RENDERBUFFER,E)}else{let Z=x.textures;for(let j=0;j<Z.length;j++){let Y=Z[j],ve=s.convert(Y.format,Y.colorSpace),oe=s.convert(Y.type),he=w(Y.internalFormat,ve,oe,Y.colorSpace),qe=Ve(x);F&&Ge(x)===!1?i.renderbufferStorageMultisample(i.RENDERBUFFER,qe,he,x.width,x.height):Ge(x)?o.renderbufferStorageMultisampleEXT(i.RENDERBUFFER,qe,he,x.width,x.height):i.renderbufferStorage(i.RENDERBUFFER,he,x.width,x.height)}}i.bindRenderbuffer(i.RENDERBUFFER,null)}function Ce(E,x){if(x&&x.isWebGLCubeRenderTarget)throw new Error("Depth Texture with cube render targets is not supported");if(t.bindFramebuffer(i.FRAMEBUFFER,E),!(x.depthTexture&&x.depthTexture.isDepthTexture))throw new Error("renderTarget.depthTexture must be an instance of THREE.DepthTexture");let Z=n.get(x.depthTexture);Z.__renderTarget=x,(!Z.__webglTexture||x.depthTexture.image.width!==x.width||x.depthTexture.image.height!==x.height)&&(x.depthTexture.image.width=x.width,x.depthTexture.image.height=x.height,x.depthTexture.needsUpdate=!0),J(x.depthTexture,0);let j=Z.__webglTexture,Y=Ve(x);if(x.depthTexture.format===nr)Ge(x)?o.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,i.DEPTH_ATTACHMENT,i.TEXTURE_2D,j,0,Y):i.framebufferTexture2D(i.FRAMEBUFFER,i.DEPTH_ATTACHMENT,i.TEXTURE_2D,j,0);else if(x.depthTexture.format===cr)Ge(x)?o.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,i.DEPTH_STENCIL_ATTACHMENT,i.TEXTURE_2D,j,0,Y):i.framebufferTexture2D(i.FRAMEBUFFER,i.DEPTH_STENCIL_ATTACHMENT,i.TEXTURE_2D,j,0);else throw new Error("Unknown depthTexture format")}function Ie(E){let x=n.get(E),F=E.isWebGLCubeRenderTarget===!0;if(x.__boundDepthTexture!==E.depthTexture){let Z=E.depthTexture;if(x.__depthDisposeCallback&&x.__depthDisposeCallback(),Z){let j=()=>{delete x.__boundDepthTexture,delete x.__depthDisposeCallback,Z.removeEventListener("dispose",j)};Z.addEventListener("dispose",j),x.__depthDisposeCallback=j}x.__boundDepthTexture=Z}if(E.depthTexture&&!x.__autoAllocateDepthBuffer){if(F)throw new Error("target.depthTexture not supported in Cube render targets");Ce(x.__webglFramebuffer,E)}else if(F){x.__webglDepthbuffer=[];for(let Z=0;Z<6;Z++)if(t.bindFramebuffer(i.FRAMEBUFFER,x.__webglFramebuffer[Z]),x.__webglDepthbuffer[Z]===void 0)x.__webglDepthbuffer[Z]=i.createRenderbuffer(),ae(x.__webglDepthbuffer[Z],E,!1);else{let j=E.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,Y=x.__webglDepthbuffer[Z];i.bindRenderbuffer(i.RENDERBUFFER,Y),i.framebufferRenderbuffer(i.FRAMEBUFFER,j,i.RENDERBUFFER,Y)}}else if(t.bindFramebuffer(i.FRAMEBUFFER,x.__webglFramebuffer),x.__webglDepthbuffer===void 0)x.__webglDepthbuffer=i.createRenderbuffer(),ae(x.__webglDepthbuffer,E,!1);else{let Z=E.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,j=x.__webglDepthbuffer;i.bindRenderbuffer(i.RENDERBUFFER,j),i.framebufferRenderbuffer(i.FRAMEBUFFER,Z,i.RENDERBUFFER,j)}t.bindFramebuffer(i.FRAMEBUFFER,null)}function ke(E,x,F){let Z=n.get(E);x!==void 0&&_e(Z.__webglFramebuffer,E,E.texture,i.COLOR_ATTACHMENT0,i.TEXTURE_2D,0),F!==void 0&&Ie(E)}function ut(E){let x=E.texture,F=n.get(E),Z=n.get(x);E.addEventListener("dispose",C);let j=E.textures,Y=E.isWebGLCubeRenderTarget===!0,ve=j.length>1;if(ve||(Z.__webglTexture===void 0&&(Z.__webglTexture=i.createTexture()),Z.__version=x.version,a.memory.textures++),Y){F.__webglFramebuffer=[];for(let oe=0;oe<6;oe++)if(x.mipmaps&&x.mipmaps.length>0){F.__webglFramebuffer[oe]=[];for(let he=0;he<x.mipmaps.length;he++)F.__webglFramebuffer[oe][he]=i.createFramebuffer()}else F.__webglFramebuffer[oe]=i.createFramebuffer()}else{if(x.mipmaps&&x.mipmaps.length>0){F.__webglFramebuffer=[];for(let oe=0;oe<x.mipmaps.length;oe++)F.__webglFramebuffer[oe]=i.createFramebuffer()}else F.__webglFramebuffer=i.createFramebuffer();if(ve)for(let oe=0,he=j.length;oe<he;oe++){let qe=n.get(j[oe]);qe.__webglTexture===void 0&&(qe.__webglTexture=i.createTexture(),a.memory.textures++)}if(E.samples>0&&Ge(E)===!1){F.__webglMultisampledFramebuffer=i.createFramebuffer(),F.__webglColorRenderbuffer=[],t.bindFramebuffer(i.FRAMEBUFFER,F.__webglMultisampledFramebuffer);for(let oe=0;oe<j.length;oe++){let he=j[oe];F.__webglColorRenderbuffer[oe]=i.createRenderbuffer(),i.bindRenderbuffer(i.RENDERBUFFER,F.__webglColorRenderbuffer[oe]);let qe=s.convert(he.format,he.colorSpace),Q=s.convert(he.type),de=w(he.internalFormat,qe,Q,he.colorSpace,E.isXRRenderTarget===!0),Ae=Ve(E);i.renderbufferStorageMultisample(i.RENDERBUFFER,Ae,de,E.width,E.height),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+oe,i.RENDERBUFFER,F.__webglColorRenderbuffer[oe])}i.bindRenderbuffer(i.RENDERBUFFER,null),E.depthBuffer&&(F.__webglDepthRenderbuffer=i.createRenderbuffer(),ae(F.__webglDepthRenderbuffer,E,!0)),t.bindFramebuffer(i.FRAMEBUFFER,null)}}if(Y){t.bindTexture(i.TEXTURE_CUBE_MAP,Z.__webglTexture),Be(i.TEXTURE_CUBE_MAP,x);for(let oe=0;oe<6;oe++)if(x.mipmaps&&x.mipmaps.length>0)for(let he=0;he<x.mipmaps.length;he++)_e(F.__webglFramebuffer[oe][he],E,x,i.COLOR_ATTACHMENT0,i.TEXTURE_CUBE_MAP_POSITIVE_X+oe,he);else _e(F.__webglFramebuffer[oe],E,x,i.COLOR_ATTACHMENT0,i.TEXTURE_CUBE_MAP_POSITIVE_X+oe,0);m(x)&&h(i.TEXTURE_CUBE_MAP),t.unbindTexture()}else if(ve){for(let oe=0,he=j.length;oe<he;oe++){let qe=j[oe],Q=n.get(qe);t.bindTexture(i.TEXTURE_2D,Q.__webglTexture),Be(i.TEXTURE_2D,qe),_e(F.__webglFramebuffer,E,qe,i.COLOR_ATTACHMENT0+oe,i.TEXTURE_2D,0),m(qe)&&h(i.TEXTURE_2D)}t.unbindTexture()}else{let oe=i.TEXTURE_2D;if((E.isWebGL3DRenderTarget||E.isWebGLArrayRenderTarget)&&(oe=E.isWebGL3DRenderTarget?i.TEXTURE_3D:i.TEXTURE_2D_ARRAY),t.bindTexture(oe,Z.__webglTexture),Be(oe,x),x.mipmaps&&x.mipmaps.length>0)for(let he=0;he<x.mipmaps.length;he++)_e(F.__webglFramebuffer[he],E,x,i.COLOR_ATTACHMENT0,oe,he);else _e(F.__webglFramebuffer,E,x,i.COLOR_ATTACHMENT0,oe,0);m(x)&&h(oe),t.unbindTexture()}E.depthBuffer&&Ie(E)}function Xe(E){let x=E.textures;for(let F=0,Z=x.length;F<Z;F++){let j=x[F];if(m(j)){let Y=T(E),ve=n.get(j).__webglTexture;t.bindTexture(Y,ve),h(Y),t.unbindTexture()}}}let pt=[],U=[];function Xt(E){if(E.samples>0){if(Ge(E)===!1){let x=E.textures,F=E.width,Z=E.height,j=i.COLOR_BUFFER_BIT,Y=E.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,ve=n.get(E),oe=x.length>1;if(oe)for(let he=0;he<x.length;he++)t.bindFramebuffer(i.FRAMEBUFFER,ve.__webglMultisampledFramebuffer),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+he,i.RENDERBUFFER,null),t.bindFramebuffer(i.FRAMEBUFFER,ve.__webglFramebuffer),i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0+he,i.TEXTURE_2D,null,0);t.bindFramebuffer(i.READ_FRAMEBUFFER,ve.__webglMultisampledFramebuffer),t.bindFramebuffer(i.DRAW_FRAMEBUFFER,ve.__webglFramebuffer);for(let he=0;he<x.length;he++){if(E.resolveDepthBuffer&&(E.depthBuffer&&(j|=i.DEPTH_BUFFER_BIT),E.stencilBuffer&&E.resolveStencilBuffer&&(j|=i.STENCIL_BUFFER_BIT)),oe){i.framebufferRenderbuffer(i.READ_FRAMEBUFFER,i.COLOR_ATTACHMENT0,i.RENDERBUFFER,ve.__webglColorRenderbuffer[he]);let qe=n.get(x[he]).__webglTexture;i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0,i.TEXTURE_2D,qe,0)}i.blitFramebuffer(0,0,F,Z,0,0,F,Z,j,i.NEAREST),l===!0&&(pt.length=0,U.length=0,pt.push(i.COLOR_ATTACHMENT0+he),E.depthBuffer&&E.resolveDepthBuffer===!1&&(pt.push(Y),U.push(Y),i.invalidateFramebuffer(i.DRAW_FRAMEBUFFER,U)),i.invalidateFramebuffer(i.READ_FRAMEBUFFER,pt))}if(t.bindFramebuffer(i.READ_FRAMEBUFFER,null),t.bindFramebuffer(i.DRAW_FRAMEBUFFER,null),oe)for(let he=0;he<x.length;he++){t.bindFramebuffer(i.FRAMEBUFFER,ve.__webglMultisampledFramebuffer),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+he,i.RENDERBUFFER,ve.__webglColorRenderbuffer[he]);let qe=n.get(x[he]).__webglTexture;t.bindFramebuffer(i.FRAMEBUFFER,ve.__webglFramebuffer),i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0+he,i.TEXTURE_2D,qe,0)}t.bindFramebuffer(i.DRAW_FRAMEBUFFER,ve.__webglMultisampledFramebuffer)}else if(E.depthBuffer&&E.resolveDepthBuffer===!1&&l){let x=E.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT;i.invalidateFramebuffer(i.DRAW_FRAMEBUFFER,[x])}}}function Ve(E){return Math.min(r.maxSamples,E.samples)}function Ge(E){let x=n.get(E);return E.samples>0&&e.has("WEBGL_multisampled_render_to_texture")===!0&&x.__useRenderToTexture!==!1}function Ee(E){let x=a.render.frame;u.get(E)!==x&&(u.set(E,x),E.update())}function st(E,x){let F=E.colorSpace,Z=E.format,j=E.type;return E.isCompressedTexture===!0||E.isVideoTexture===!0||F!==mr&&F!==Jn&&(Ye.getTransfer(F)===je?(Z!==an||j!==Nn)&&console.warn("THREE.WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType."):console.error("THREE.WebGLTextures: Unsupported texture color space:",F)),x}function be(E){return typeof HTMLImageElement<"u"&&E instanceof HTMLImageElement?(c.width=E.naturalWidth||E.width,c.height=E.naturalHeight||E.height):typeof VideoFrame<"u"&&E instanceof VideoFrame?(c.width=E.displayWidth,c.height=E.displayHeight):(c.width=E.width,c.height=E.height),c}this.allocateTextureUnit=z,this.resetTextureUnits=V,this.setTexture2D=J,this.setTexture2DArray=q,this.setTexture3D=te,this.setTextureCube=W,this.rebindTextures=ke,this.setupRenderTarget=ut,this.updateRenderTargetMipmap=Xe,this.updateMultisampleRenderTarget=Xt,this.setupDepthRenderbuffer=Ie,this.setupFrameBufferTexture=_e,this.useMultisampledRTT=Ge}function U_(i,e){function t(n,r=Jn){let s,a=Ye.getTransfer(r);if(n===Nn)return i.UNSIGNED_BYTE;if(n===Cc)return i.UNSIGNED_SHORT_4_4_4_4;if(n===Rc)return i.UNSIGNED_SHORT_5_5_5_1;if(n===rh)return i.UNSIGNED_INT_5_9_9_9_REV;if(n===nh)return i.BYTE;if(n===ih)return i.SHORT;if(n===Hr)return i.UNSIGNED_SHORT;if(n===Ac)return i.INT;if(n===_i)return i.UNSIGNED_INT;if(n===Ln)return i.FLOAT;if(n===$r)return i.HALF_FLOAT;if(n===sh)return i.ALPHA;if(n===ah)return i.RGB;if(n===an)return i.RGBA;if(n===oh)return i.LUMINANCE;if(n===lh)return i.LUMINANCE_ALPHA;if(n===nr)return i.DEPTH_COMPONENT;if(n===cr)return i.DEPTH_STENCIL;if(n===ch)return i.RED;if(n===Pc)return i.RED_INTEGER;if(n===uh)return i.RG;if(n===Ic)return i.RG_INTEGER;if(n===Lc)return i.RGBA_INTEGER;if(n===zs||n===Hs||n===Vs||n===Gs)if(a===je)if(s=e.get("WEBGL_compressed_texture_s3tc_srgb"),s!==null){if(n===zs)return s.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(n===Hs)return s.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(n===Vs)return s.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(n===Gs)return s.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null;else if(s=e.get("WEBGL_compressed_texture_s3tc"),s!==null){if(n===zs)return s.COMPRESSED_RGB_S3TC_DXT1_EXT;if(n===Hs)return s.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(n===Vs)return s.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(n===Gs)return s.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null;if(n===bl||n===wl||n===El||n===Tl)if(s=e.get("WEBGL_compressed_texture_pvrtc"),s!==null){if(n===bl)return s.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(n===wl)return s.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(n===El)return s.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(n===Tl)return s.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null;if(n===Al||n===Cl||n===Rl)if(s=e.get("WEBGL_compressed_texture_etc"),s!==null){if(n===Al||n===Cl)return a===je?s.COMPRESSED_SRGB8_ETC2:s.COMPRESSED_RGB8_ETC2;if(n===Rl)return a===je?s.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:s.COMPRESSED_RGBA8_ETC2_EAC}else return null;if(n===Pl||n===Il||n===Ll||n===Dl||n===Ul||n===Nl||n===Ol||n===Fl||n===Bl||n===kl||n===zl||n===Hl||n===Vl||n===Gl)if(s=e.get("WEBGL_compressed_texture_astc"),s!==null){if(n===Pl)return a===je?s.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:s.COMPRESSED_RGBA_ASTC_4x4_KHR;if(n===Il)return a===je?s.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:s.COMPRESSED_RGBA_ASTC_5x4_KHR;if(n===Ll)return a===je?s.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:s.COMPRESSED_RGBA_ASTC_5x5_KHR;if(n===Dl)return a===je?s.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:s.COMPRESSED_RGBA_ASTC_6x5_KHR;if(n===Ul)return a===je?s.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:s.COMPRESSED_RGBA_ASTC_6x6_KHR;if(n===Nl)return a===je?s.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:s.COMPRESSED_RGBA_ASTC_8x5_KHR;if(n===Ol)return a===je?s.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:s.COMPRESSED_RGBA_ASTC_8x6_KHR;if(n===Fl)return a===je?s.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:s.COMPRESSED_RGBA_ASTC_8x8_KHR;if(n===Bl)return a===je?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:s.COMPRESSED_RGBA_ASTC_10x5_KHR;if(n===kl)return a===je?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:s.COMPRESSED_RGBA_ASTC_10x6_KHR;if(n===zl)return a===je?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:s.COMPRESSED_RGBA_ASTC_10x8_KHR;if(n===Hl)return a===je?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:s.COMPRESSED_RGBA_ASTC_10x10_KHR;if(n===Vl)return a===je?s.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:s.COMPRESSED_RGBA_ASTC_12x10_KHR;if(n===Gl)return a===je?s.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:s.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null;if(n===Ws||n===Wl||n===Xl)if(s=e.get("EXT_texture_compression_bptc"),s!==null){if(n===Ws)return a===je?s.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:s.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(n===Wl)return s.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(n===Xl)return s.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null;if(n===fh||n===ql||n===Yl||n===$l)if(s=e.get("EXT_texture_compression_rgtc"),s!==null){if(n===Ws)return s.COMPRESSED_RED_RGTC1_EXT;if(n===ql)return s.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(n===Yl)return s.COMPRESSED_RED_GREEN_RGTC2_EXT;if(n===$l)return s.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null;return n===lr?i.UNSIGNED_INT_24_8:i[n]!==void 0?i[n]:null}return{convert:t}}var cc=class extends Dt{constructor(e=[]){super(),this.isArrayCamera=!0,this.cameras=e}},gn=class extends Ut{constructor(){super(),this.isGroup=!0,this.type="Group"}},N_={type:"move"},zr=class{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new gn,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new gn,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new O,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new O),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new gn,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new O,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new O),this._grip}dispatchEvent(e){return this._targetRay!==null&&this._targetRay.dispatchEvent(e),this._grip!==null&&this._grip.dispatchEvent(e),this._hand!==null&&this._hand.dispatchEvent(e),this}connect(e){if(e&&e.hand){let t=this._hand;if(t)for(let n of e.hand.values())this._getHandJoint(t,n)}return this.dispatchEvent({type:"connected",data:e}),this}disconnect(e){return this.dispatchEvent({type:"disconnected",data:e}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(e,t,n){let r=null,s=null,a=null,o=this._targetRay,l=this._grip,c=this._hand;if(e&&t.session.visibilityState!=="visible-blurred"){if(c&&e.hand){a=!0;for(let _ of e.hand.values()){let m=t.getJointPose(_,n),h=this._getHandJoint(c,_);m!==null&&(h.matrix.fromArray(m.transform.matrix),h.matrix.decompose(h.position,h.rotation,h.scale),h.matrixWorldNeedsUpdate=!0,h.jointRadius=m.radius),h.visible=m!==null}let u=c.joints["index-finger-tip"],f=c.joints["thumb-tip"],d=u.position.distanceTo(f.position),p=.02,g=.005;c.inputState.pinching&&d>p+g?(c.inputState.pinching=!1,this.dispatchEvent({type:"pinchend",handedness:e.handedness,target:this})):!c.inputState.pinching&&d<=p-g&&(c.inputState.pinching=!0,this.dispatchEvent({type:"pinchstart",handedness:e.handedness,target:this}))}else l!==null&&e.gripSpace&&(s=t.getPose(e.gripSpace,n),s!==null&&(l.matrix.fromArray(s.transform.matrix),l.matrix.decompose(l.position,l.rotation,l.scale),l.matrixWorldNeedsUpdate=!0,s.linearVelocity?(l.hasLinearVelocity=!0,l.linearVelocity.copy(s.linearVelocity)):l.hasLinearVelocity=!1,s.angularVelocity?(l.hasAngularVelocity=!0,l.angularVelocity.copy(s.angularVelocity)):l.hasAngularVelocity=!1));o!==null&&(r=t.getPose(e.targetRaySpace,n),r===null&&s!==null&&(r=s),r!==null&&(o.matrix.fromArray(r.transform.matrix),o.matrix.decompose(o.position,o.rotation,o.scale),o.matrixWorldNeedsUpdate=!0,r.linearVelocity?(o.hasLinearVelocity=!0,o.linearVelocity.copy(r.linearVelocity)):o.hasLinearVelocity=!1,r.angularVelocity?(o.hasAngularVelocity=!0,o.angularVelocity.copy(r.angularVelocity)):o.hasAngularVelocity=!1,this.dispatchEvent(N_)))}return o!==null&&(o.visible=r!==null),l!==null&&(l.visible=s!==null),c!==null&&(c.visible=a!==null),this}_getHandJoint(e,t){if(e.joints[t.jointName]===void 0){let n=new gn;n.matrixAutoUpdate=!1,n.visible=!1,e.joints[t.jointName]=n,e.add(n)}return e.joints[t.jointName]}},O_=`
void main() {

	gl_Position = vec4( position, 1.0 );

}`,F_=`
uniform sampler2DArray depthColor;
uniform float depthWidth;
uniform float depthHeight;

void main() {

	vec2 coord = vec2( gl_FragCoord.x / depthWidth, gl_FragCoord.y / depthHeight );

	if ( coord.x >= 1.0 ) {

		gl_FragDepth = texture( depthColor, vec3( coord.x - 1.0, coord.y, 1 ) ).r;

	} else {

		gl_FragDepth = texture( depthColor, vec3( coord.x, coord.y, 0 ) ).r;

	}

}`,uc=class{constructor(){this.texture=null,this.mesh=null,this.depthNear=0,this.depthFar=0}init(e,t,n){if(this.texture===null){let r=new Gt,s=e.properties.get(r);s.__webglTexture=t.texture,(t.depthNear!=n.depthNear||t.depthFar!=n.depthFar)&&(this.depthNear=t.depthNear,this.depthFar=t.depthFar),this.texture=r}}getMesh(e){if(this.texture!==null&&this.mesh===null){let t=e.cameras[0].viewport,n=new xn({vertexShader:O_,fragmentShader:F_,uniforms:{depthColor:{value:this.texture},depthWidth:{value:t.z},depthHeight:{value:t.w}}});this.mesh=new Qe(new hr(20,20),n)}return this.mesh}reset(){this.texture=null,this.mesh=null}getDepthTexture(){return this.texture}},fc=class extends On{constructor(e,t){super();let n=this,r=null,s=1,a=null,o="local-floor",l=1,c=null,u=null,f=null,d=null,p=null,g=null,_=new uc,m=t.getContextAttributes(),h=null,T=null,w=[],M=[],N=new we,A=null,C=new Dt;C.viewport=new ht;let D=new Dt;D.viewport=new ht;let b=[C,D],S=new cc,R=null,V=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function($){let ne=w[$];return ne===void 0&&(ne=new zr,w[$]=ne),ne.getTargetRaySpace()},this.getControllerGrip=function($){let ne=w[$];return ne===void 0&&(ne=new zr,w[$]=ne),ne.getGripSpace()},this.getHand=function($){let ne=w[$];return ne===void 0&&(ne=new zr,w[$]=ne),ne.getHandSpace()};function z($){let ne=M.indexOf($.inputSource);if(ne===-1)return;let _e=w[ne];_e!==void 0&&(_e.update($.inputSource,$.frame,c||a),_e.dispatchEvent({type:$.type,data:$.inputSource}))}function X(){r.removeEventListener("select",z),r.removeEventListener("selectstart",z),r.removeEventListener("selectend",z),r.removeEventListener("squeeze",z),r.removeEventListener("squeezestart",z),r.removeEventListener("squeezeend",z),r.removeEventListener("end",X),r.removeEventListener("inputsourceschange",J);for(let $=0;$<w.length;$++){let ne=M[$];ne!==null&&(M[$]=null,w[$].disconnect(ne))}R=null,V=null,_.reset(),e.setRenderTarget(h),p=null,d=null,f=null,r=null,T=null,tt.stop(),n.isPresenting=!1,e.setPixelRatio(A),e.setSize(N.width,N.height,!1),n.dispatchEvent({type:"sessionend"})}this.setFramebufferScaleFactor=function($){s=$,n.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change framebuffer scale while presenting.")},this.setReferenceSpaceType=function($){o=$,n.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change reference space type while presenting.")},this.getReferenceSpace=function(){return c||a},this.setReferenceSpace=function($){c=$},this.getBaseLayer=function(){return d!==null?d:p},this.getBinding=function(){return f},this.getFrame=function(){return g},this.getSession=function(){return r},this.setSession=async function($){if(r=$,r!==null){if(h=e.getRenderTarget(),r.addEventListener("select",z),r.addEventListener("selectstart",z),r.addEventListener("selectend",z),r.addEventListener("squeeze",z),r.addEventListener("squeezestart",z),r.addEventListener("squeezeend",z),r.addEventListener("end",X),r.addEventListener("inputsourceschange",J),m.xrCompatible!==!0&&await t.makeXRCompatible(),A=e.getPixelRatio(),e.getSize(N),r.renderState.layers===void 0){let ne={antialias:m.antialias,alpha:!0,depth:m.depth,stencil:m.stencil,framebufferScaleFactor:s};p=new XRWebGLLayer(r,t,ne),r.updateRenderState({baseLayer:p}),e.setPixelRatio(1),e.setSize(p.framebufferWidth,p.framebufferHeight,!1),T=new Fn(p.framebufferWidth,p.framebufferHeight,{format:an,type:Nn,colorSpace:e.outputColorSpace,stencilBuffer:m.stencil})}else{let ne=null,_e=null,ae=null;m.depth&&(ae=m.stencil?t.DEPTH24_STENCIL8:t.DEPTH_COMPONENT24,ne=m.stencil?cr:nr,_e=m.stencil?lr:_i);let Ce={colorFormat:t.RGBA8,depthFormat:ae,scaleFactor:s};f=new XRWebGLBinding(r,t),d=f.createProjectionLayer(Ce),r.updateRenderState({layers:[d]}),e.setPixelRatio(1),e.setSize(d.textureWidth,d.textureHeight,!1),T=new Fn(d.textureWidth,d.textureHeight,{format:an,type:Nn,depthTexture:new ia(d.textureWidth,d.textureHeight,_e,void 0,void 0,void 0,void 0,void 0,void 0,ne),stencilBuffer:m.stencil,colorSpace:e.outputColorSpace,samples:m.antialias?4:0,resolveDepthBuffer:d.ignoreDepthValues===!1})}T.isXRRenderTarget=!0,this.setFoveation(l),c=null,a=await r.requestReferenceSpace(o),tt.setContext(r),tt.start(),n.isPresenting=!0,n.dispatchEvent({type:"sessionstart"})}},this.getEnvironmentBlendMode=function(){if(r!==null)return r.environmentBlendMode},this.getDepthTexture=function(){return _.getDepthTexture()};function J($){for(let ne=0;ne<$.removed.length;ne++){let _e=$.removed[ne],ae=M.indexOf(_e);ae>=0&&(M[ae]=null,w[ae].disconnect(_e))}for(let ne=0;ne<$.added.length;ne++){let _e=$.added[ne],ae=M.indexOf(_e);if(ae===-1){for(let Ie=0;Ie<w.length;Ie++)if(Ie>=M.length){M.push(_e),ae=Ie;break}else if(M[Ie]===null){M[Ie]=_e,ae=Ie;break}if(ae===-1)break}let Ce=w[ae];Ce&&Ce.connect(_e)}}let q=new O,te=new O;function W($,ne,_e){q.setFromMatrixPosition(ne.matrixWorld),te.setFromMatrixPosition(_e.matrixWorld);let ae=q.distanceTo(te),Ce=ne.projectionMatrix.elements,Ie=_e.projectionMatrix.elements,ke=Ce[14]/(Ce[10]-1),ut=Ce[14]/(Ce[10]+1),Xe=(Ce[9]+1)/Ce[5],pt=(Ce[9]-1)/Ce[5],U=(Ce[8]-1)/Ce[0],Xt=(Ie[8]+1)/Ie[0],Ve=ke*U,Ge=ke*Xt,Ee=ae/(-U+Xt),st=Ee*-U;if(ne.matrixWorld.decompose($.position,$.quaternion,$.scale),$.translateX(st),$.translateZ(Ee),$.matrixWorld.compose($.position,$.quaternion,$.scale),$.matrixWorldInverse.copy($.matrixWorld).invert(),Ce[10]===-1)$.projectionMatrix.copy(ne.projectionMatrix),$.projectionMatrixInverse.copy(ne.projectionMatrixInverse);else{let be=ke+Ee,E=ut+Ee,x=Ve-st,F=Ge+(ae-st),Z=Xe*ut/E*be,j=pt*ut/E*be;$.projectionMatrix.makePerspective(x,F,Z,j,be,E),$.projectionMatrixInverse.copy($.projectionMatrix).invert()}}function se($,ne){ne===null?$.matrixWorld.copy($.matrix):$.matrixWorld.multiplyMatrices(ne.matrixWorld,$.matrix),$.matrixWorldInverse.copy($.matrixWorld).invert()}this.updateCamera=function($){if(r===null)return;let ne=$.near,_e=$.far;_.texture!==null&&(_.depthNear>0&&(ne=_.depthNear),_.depthFar>0&&(_e=_.depthFar)),S.near=D.near=C.near=ne,S.far=D.far=C.far=_e,(R!==S.near||V!==S.far)&&(r.updateRenderState({depthNear:S.near,depthFar:S.far}),R=S.near,V=S.far),C.layers.mask=$.layers.mask|2,D.layers.mask=$.layers.mask|4,S.layers.mask=C.layers.mask|D.layers.mask;let ae=$.parent,Ce=S.cameras;se(S,ae);for(let Ie=0;Ie<Ce.length;Ie++)se(Ce[Ie],ae);Ce.length===2?W(S,C,D):S.projectionMatrix.copy(C.projectionMatrix),fe($,S,ae)};function fe($,ne,_e){_e===null?$.matrix.copy(ne.matrixWorld):($.matrix.copy(_e.matrixWorld),$.matrix.invert(),$.matrix.multiply(ne.matrixWorld)),$.matrix.decompose($.position,$.quaternion,$.scale),$.updateMatrixWorld(!0),$.projectionMatrix.copy(ne.projectionMatrix),$.projectionMatrixInverse.copy(ne.projectionMatrixInverse),$.isPerspectiveCamera&&($.fov=Vr*2*Math.atan(1/$.projectionMatrix.elements[5]),$.zoom=1)}this.getCamera=function(){return S},this.getFoveation=function(){if(!(d===null&&p===null))return l},this.setFoveation=function($){l=$,d!==null&&(d.fixedFoveation=$),p!==null&&p.fixedFoveation!==void 0&&(p.fixedFoveation=$)},this.hasDepthSensing=function(){return _.texture!==null},this.getDepthSensingMesh=function(){return _.getMesh(S)};let Me=null;function Be($,ne){if(u=ne.getViewerPose(c||a),g=ne,u!==null){let _e=u.views;p!==null&&(e.setRenderTargetFramebuffer(T,p.framebuffer),e.setRenderTarget(T));let ae=!1;_e.length!==S.cameras.length&&(S.cameras.length=0,ae=!0);for(let Ie=0;Ie<_e.length;Ie++){let ke=_e[Ie],ut=null;if(p!==null)ut=p.getViewport(ke);else{let pt=f.getViewSubImage(d,ke);ut=pt.viewport,Ie===0&&(e.setRenderTargetTextures(T,pt.colorTexture,d.ignoreDepthValues?void 0:pt.depthStencilTexture),e.setRenderTarget(T))}let Xe=b[Ie];Xe===void 0&&(Xe=new Dt,Xe.layers.enable(Ie),Xe.viewport=new ht,b[Ie]=Xe),Xe.matrix.fromArray(ke.transform.matrix),Xe.matrix.decompose(Xe.position,Xe.quaternion,Xe.scale),Xe.projectionMatrix.fromArray(ke.projectionMatrix),Xe.projectionMatrixInverse.copy(Xe.projectionMatrix).invert(),Xe.viewport.set(ut.x,ut.y,ut.width,ut.height),Ie===0&&(S.matrix.copy(Xe.matrix),S.matrix.decompose(S.position,S.quaternion,S.scale)),ae===!0&&S.cameras.push(Xe)}let Ce=r.enabledFeatures;if(Ce&&Ce.includes("depth-sensing")){let Ie=f.getDepthInformation(_e[0]);Ie&&Ie.isValid&&Ie.texture&&_.init(e,Ie,r.renderState)}}for(let _e=0;_e<w.length;_e++){let ae=M[_e],Ce=w[_e];ae!==null&&Ce!==void 0&&Ce.update(ae,ne,c||a)}Me&&Me($,ne),ne.detectedPlanes&&n.dispatchEvent({type:"planesdetected",data:ne}),g=null}let tt=new _h;tt.setAnimationLoop(Be),this.setAnimationLoop=function($){Me=$},this.dispose=function(){}}},fi=new Zt,B_=new dt;function k_(i,e){function t(m,h){m.matrixAutoUpdate===!0&&m.updateMatrix(),h.value.copy(m.matrix)}function n(m,h){h.color.getRGB(m.fogColor.value,xh(i)),h.isFog?(m.fogNear.value=h.near,m.fogFar.value=h.far):h.isFogExp2&&(m.fogDensity.value=h.density)}function r(m,h,T,w,M){h.isMeshBasicMaterial||h.isMeshLambertMaterial?s(m,h):h.isMeshToonMaterial?(s(m,h),f(m,h)):h.isMeshPhongMaterial?(s(m,h),u(m,h)):h.isMeshStandardMaterial?(s(m,h),d(m,h),h.isMeshPhysicalMaterial&&p(m,h,M)):h.isMeshMatcapMaterial?(s(m,h),g(m,h)):h.isMeshDepthMaterial?s(m,h):h.isMeshDistanceMaterial?(s(m,h),_(m,h)):h.isMeshNormalMaterial?s(m,h):h.isLineBasicMaterial?(a(m,h),h.isLineDashedMaterial&&o(m,h)):h.isPointsMaterial?l(m,h,T,w):h.isSpriteMaterial?c(m,h):h.isShadowMaterial?(m.color.value.copy(h.color),m.opacity.value=h.opacity):h.isShaderMaterial&&(h.uniformsNeedUpdate=!1)}function s(m,h){m.opacity.value=h.opacity,h.color&&m.diffuse.value.copy(h.color),h.emissive&&m.emissive.value.copy(h.emissive).multiplyScalar(h.emissiveIntensity),h.map&&(m.map.value=h.map,t(h.map,m.mapTransform)),h.alphaMap&&(m.alphaMap.value=h.alphaMap,t(h.alphaMap,m.alphaMapTransform)),h.bumpMap&&(m.bumpMap.value=h.bumpMap,t(h.bumpMap,m.bumpMapTransform),m.bumpScale.value=h.bumpScale,h.side===Ot&&(m.bumpScale.value*=-1)),h.normalMap&&(m.normalMap.value=h.normalMap,t(h.normalMap,m.normalMapTransform),m.normalScale.value.copy(h.normalScale),h.side===Ot&&m.normalScale.value.negate()),h.displacementMap&&(m.displacementMap.value=h.displacementMap,t(h.displacementMap,m.displacementMapTransform),m.displacementScale.value=h.displacementScale,m.displacementBias.value=h.displacementBias),h.emissiveMap&&(m.emissiveMap.value=h.emissiveMap,t(h.emissiveMap,m.emissiveMapTransform)),h.specularMap&&(m.specularMap.value=h.specularMap,t(h.specularMap,m.specularMapTransform)),h.alphaTest>0&&(m.alphaTest.value=h.alphaTest);let T=e.get(h),w=T.envMap,M=T.envMapRotation;w&&(m.envMap.value=w,fi.copy(M),fi.x*=-1,fi.y*=-1,fi.z*=-1,w.isCubeTexture&&w.isRenderTargetTexture===!1&&(fi.y*=-1,fi.z*=-1),m.envMapRotation.value.setFromMatrix4(B_.makeRotationFromEuler(fi)),m.flipEnvMap.value=w.isCubeTexture&&w.isRenderTargetTexture===!1?-1:1,m.reflectivity.value=h.reflectivity,m.ior.value=h.ior,m.refractionRatio.value=h.refractionRatio),h.lightMap&&(m.lightMap.value=h.lightMap,m.lightMapIntensity.value=h.lightMapIntensity,t(h.lightMap,m.lightMapTransform)),h.aoMap&&(m.aoMap.value=h.aoMap,m.aoMapIntensity.value=h.aoMapIntensity,t(h.aoMap,m.aoMapTransform))}function a(m,h){m.diffuse.value.copy(h.color),m.opacity.value=h.opacity,h.map&&(m.map.value=h.map,t(h.map,m.mapTransform))}function o(m,h){m.dashSize.value=h.dashSize,m.totalSize.value=h.dashSize+h.gapSize,m.scale.value=h.scale}function l(m,h,T,w){m.diffuse.value.copy(h.color),m.opacity.value=h.opacity,m.size.value=h.size*T,m.scale.value=w*.5,h.map&&(m.map.value=h.map,t(h.map,m.uvTransform)),h.alphaMap&&(m.alphaMap.value=h.alphaMap,t(h.alphaMap,m.alphaMapTransform)),h.alphaTest>0&&(m.alphaTest.value=h.alphaTest)}function c(m,h){m.diffuse.value.copy(h.color),m.opacity.value=h.opacity,m.rotation.value=h.rotation,h.map&&(m.map.value=h.map,t(h.map,m.mapTransform)),h.alphaMap&&(m.alphaMap.value=h.alphaMap,t(h.alphaMap,m.alphaMapTransform)),h.alphaTest>0&&(m.alphaTest.value=h.alphaTest)}function u(m,h){m.specular.value.copy(h.specular),m.shininess.value=Math.max(h.shininess,1e-4)}function f(m,h){h.gradientMap&&(m.gradientMap.value=h.gradientMap)}function d(m,h){m.metalness.value=h.metalness,h.metalnessMap&&(m.metalnessMap.value=h.metalnessMap,t(h.metalnessMap,m.metalnessMapTransform)),m.roughness.value=h.roughness,h.roughnessMap&&(m.roughnessMap.value=h.roughnessMap,t(h.roughnessMap,m.roughnessMapTransform)),h.envMap&&(m.envMapIntensity.value=h.envMapIntensity)}function p(m,h,T){m.ior.value=h.ior,h.sheen>0&&(m.sheenColor.value.copy(h.sheenColor).multiplyScalar(h.sheen),m.sheenRoughness.value=h.sheenRoughness,h.sheenColorMap&&(m.sheenColorMap.value=h.sheenColorMap,t(h.sheenColorMap,m.sheenColorMapTransform)),h.sheenRoughnessMap&&(m.sheenRoughnessMap.value=h.sheenRoughnessMap,t(h.sheenRoughnessMap,m.sheenRoughnessMapTransform))),h.clearcoat>0&&(m.clearcoat.value=h.clearcoat,m.clearcoatRoughness.value=h.clearcoatRoughness,h.clearcoatMap&&(m.clearcoatMap.value=h.clearcoatMap,t(h.clearcoatMap,m.clearcoatMapTransform)),h.clearcoatRoughnessMap&&(m.clearcoatRoughnessMap.value=h.clearcoatRoughnessMap,t(h.clearcoatRoughnessMap,m.clearcoatRoughnessMapTransform)),h.clearcoatNormalMap&&(m.clearcoatNormalMap.value=h.clearcoatNormalMap,t(h.clearcoatNormalMap,m.clearcoatNormalMapTransform),m.clearcoatNormalScale.value.copy(h.clearcoatNormalScale),h.side===Ot&&m.clearcoatNormalScale.value.negate())),h.dispersion>0&&(m.dispersion.value=h.dispersion),h.iridescence>0&&(m.iridescence.value=h.iridescence,m.iridescenceIOR.value=h.iridescenceIOR,m.iridescenceThicknessMinimum.value=h.iridescenceThicknessRange[0],m.iridescenceThicknessMaximum.value=h.iridescenceThicknessRange[1],h.iridescenceMap&&(m.iridescenceMap.value=h.iridescenceMap,t(h.iridescenceMap,m.iridescenceMapTransform)),h.iridescenceThicknessMap&&(m.iridescenceThicknessMap.value=h.iridescenceThicknessMap,t(h.iridescenceThicknessMap,m.iridescenceThicknessMapTransform))),h.transmission>0&&(m.transmission.value=h.transmission,m.transmissionSamplerMap.value=T.texture,m.transmissionSamplerSize.value.set(T.width,T.height),h.transmissionMap&&(m.transmissionMap.value=h.transmissionMap,t(h.transmissionMap,m.transmissionMapTransform)),m.thickness.value=h.thickness,h.thicknessMap&&(m.thicknessMap.value=h.thicknessMap,t(h.thicknessMap,m.thicknessMapTransform)),m.attenuationDistance.value=h.attenuationDistance,m.attenuationColor.value.copy(h.attenuationColor)),h.anisotropy>0&&(m.anisotropyVector.value.set(h.anisotropy*Math.cos(h.anisotropyRotation),h.anisotropy*Math.sin(h.anisotropyRotation)),h.anisotropyMap&&(m.anisotropyMap.value=h.anisotropyMap,t(h.anisotropyMap,m.anisotropyMapTransform))),m.specularIntensity.value=h.specularIntensity,m.specularColor.value.copy(h.specularColor),h.specularColorMap&&(m.specularColorMap.value=h.specularColorMap,t(h.specularColorMap,m.specularColorMapTransform)),h.specularIntensityMap&&(m.specularIntensityMap.value=h.specularIntensityMap,t(h.specularIntensityMap,m.specularIntensityMapTransform))}function g(m,h){h.matcap&&(m.matcap.value=h.matcap)}function _(m,h){let T=e.get(h).light;m.referencePosition.value.setFromMatrixPosition(T.matrixWorld),m.nearDistance.value=T.shadow.camera.near,m.farDistance.value=T.shadow.camera.far}return{refreshFogUniforms:n,refreshMaterialUniforms:r}}function z_(i,e,t,n){let r={},s={},a=[],o=i.getParameter(i.MAX_UNIFORM_BUFFER_BINDINGS);function l(T,w){let M=w.program;n.uniformBlockBinding(T,M)}function c(T,w){let M=r[T.id];M===void 0&&(g(T),M=u(T),r[T.id]=M,T.addEventListener("dispose",m));let N=w.program;n.updateUBOMapping(T,N);let A=e.render.frame;s[T.id]!==A&&(d(T),s[T.id]=A)}function u(T){let w=f();T.__bindingPointIndex=w;let M=i.createBuffer(),N=T.__size,A=T.usage;return i.bindBuffer(i.UNIFORM_BUFFER,M),i.bufferData(i.UNIFORM_BUFFER,N,A),i.bindBuffer(i.UNIFORM_BUFFER,null),i.bindBufferBase(i.UNIFORM_BUFFER,w,M),M}function f(){for(let T=0;T<o;T++)if(a.indexOf(T)===-1)return a.push(T),T;return console.error("THREE.WebGLRenderer: Maximum number of simultaneously usable uniforms groups reached."),0}function d(T){let w=r[T.id],M=T.uniforms,N=T.__cache;i.bindBuffer(i.UNIFORM_BUFFER,w);for(let A=0,C=M.length;A<C;A++){let D=Array.isArray(M[A])?M[A]:[M[A]];for(let b=0,S=D.length;b<S;b++){let R=D[b];if(p(R,A,b,N)===!0){let V=R.__offset,z=Array.isArray(R.value)?R.value:[R.value],X=0;for(let J=0;J<z.length;J++){let q=z[J],te=_(q);typeof q=="number"||typeof q=="boolean"?(R.__data[0]=q,i.bufferSubData(i.UNIFORM_BUFFER,V+X,R.__data)):q.isMatrix3?(R.__data[0]=q.elements[0],R.__data[1]=q.elements[1],R.__data[2]=q.elements[2],R.__data[3]=0,R.__data[4]=q.elements[3],R.__data[5]=q.elements[4],R.__data[6]=q.elements[5],R.__data[7]=0,R.__data[8]=q.elements[6],R.__data[9]=q.elements[7],R.__data[10]=q.elements[8],R.__data[11]=0):(q.toArray(R.__data,X),X+=te.storage/Float32Array.BYTES_PER_ELEMENT)}i.bufferSubData(i.UNIFORM_BUFFER,V,R.__data)}}}i.bindBuffer(i.UNIFORM_BUFFER,null)}function p(T,w,M,N){let A=T.value,C=w+"_"+M;if(N[C]===void 0)return typeof A=="number"||typeof A=="boolean"?N[C]=A:N[C]=A.clone(),!0;{let D=N[C];if(typeof A=="number"||typeof A=="boolean"){if(D!==A)return N[C]=A,!0}else if(D.equals(A)===!1)return D.copy(A),!0}return!1}function g(T){let w=T.uniforms,M=0,N=16;for(let C=0,D=w.length;C<D;C++){let b=Array.isArray(w[C])?w[C]:[w[C]];for(let S=0,R=b.length;S<R;S++){let V=b[S],z=Array.isArray(V.value)?V.value:[V.value];for(let X=0,J=z.length;X<J;X++){let q=z[X],te=_(q),W=M%N,se=W%te.boundary,fe=W+se;M+=se,fe!==0&&N-fe<te.storage&&(M+=N-fe),V.__data=new Float32Array(te.storage/Float32Array.BYTES_PER_ELEMENT),V.__offset=M,M+=te.storage}}}let A=M%N;return A>0&&(M+=N-A),T.__size=M,T.__cache={},this}function _(T){let w={boundary:0,storage:0};return typeof T=="number"||typeof T=="boolean"?(w.boundary=4,w.storage=4):T.isVector2?(w.boundary=8,w.storage=8):T.isVector3||T.isColor?(w.boundary=16,w.storage=12):T.isVector4?(w.boundary=16,w.storage=16):T.isMatrix3?(w.boundary=48,w.storage=48):T.isMatrix4?(w.boundary=64,w.storage=64):T.isTexture?console.warn("THREE.WebGLRenderer: Texture samplers can not be part of an uniforms group."):console.warn("THREE.WebGLRenderer: Unsupported uniform value type.",T),w}function m(T){let w=T.target;w.removeEventListener("dispose",m);let M=a.indexOf(w.__bindingPointIndex);a.splice(M,1),i.deleteBuffer(r[w.id]),delete r[w.id],delete s[w.id]}function h(){for(let T in r)i.deleteBuffer(r[T]);a=[],r={},s={}}return{bind:l,update:c,dispose:h}}var ra=class{constructor(e={}){let{canvas:t=Wp(),context:n=null,depth:r=!0,stencil:s=!1,alpha:a=!1,antialias:o=!1,premultipliedAlpha:l=!0,preserveDrawingBuffer:c=!1,powerPreference:u="default",failIfMajorPerformanceCaveat:f=!1,reverseDepthBuffer:d=!1}=e;this.isWebGLRenderer=!0;let p;if(n!==null){if(typeof WebGLRenderingContext<"u"&&n instanceof WebGLRenderingContext)throw new Error("THREE.WebGLRenderer: WebGL 1 is not supported since r163.");p=n.getContextAttributes().alpha}else p=a;let g=new Uint32Array(4),_=new Int32Array(4),m=null,h=null,T=[],w=[];this.domElement=t,this.debug={checkShaderErrors:!0,onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this._outputColorSpace=bt,this.toneMapping=Qn,this.toneMappingExposure=1;let M=this,N=!1,A=0,C=0,D=null,b=-1,S=null,R=new ht,V=new ht,z=null,X=new ze(0),J=0,q=t.width,te=t.height,W=1,se=null,fe=null,Me=new ht(0,0,q,te),Be=new ht(0,0,q,te),tt=!1,$=new Xr,ne=!1,_e=!1,ae=new dt,Ce=new dt,Ie=new O,ke=new ht,ut={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0},Xe=!1;function pt(){return D===null?W:1}let U=n;function Xt(y,I){return t.getContext(y,I)}try{let y={alpha:!0,depth:r,stencil:s,antialias:o,premultipliedAlpha:l,preserveDrawingBuffer:c,powerPreference:u,failIfMajorPerformanceCaveat:f};if("setAttribute"in t&&t.setAttribute("data-engine","three.js r170"),t.addEventListener("webglcontextlost",K,!1),t.addEventListener("webglcontextrestored",ue,!1),t.addEventListener("webglcontextcreationerror",le,!1),U===null){let I="webgl2";if(U=Xt(I,y),U===null)throw Xt(I)?new Error("Error creating WebGL context with your selected attributes."):new Error("Error creating WebGL context.")}}catch(y){throw console.error("THREE.WebGLRenderer: "+y.message),y}let Ve,Ge,Ee,st,be,E,x,F,Z,j,Y,ve,oe,he,qe,Q,de,Ae,Re,pe,We,Oe,nt,P;function re(){Ve=new n0(U),Ve.init(),Oe=new U_(U,Ve),Ge=new Kx(U,Ve,e,Oe),Ee=new I_(U,Ve),Ge.reverseDepthBuffer&&d&&Ee.buffers.depth.setReversed(!0),st=new s0(U),be=new __,E=new D_(U,Ve,Ee,be,Ge,Oe,st),x=new jx(M),F=new t0(M),Z=new hm(U),nt=new $x(U,Z),j=new i0(U,Z,st,nt),Y=new o0(U,j,Z,st),Re=new a0(U,Ge,E),Q=new Jx(be),ve=new x_(M,x,F,Ve,Ge,nt,Q),oe=new k_(M,be),he=new v_,qe=new T_(Ve),Ae=new Yx(M,x,F,Ee,Y,p,l),de=new R_(M,Y,Ge),P=new z_(U,st,Ge,Ee),pe=new Zx(U,Ve,st),We=new r0(U,Ve,st),st.programs=ve.programs,M.capabilities=Ge,M.extensions=Ve,M.properties=be,M.renderLists=he,M.shadowMap=de,M.state=Ee,M.info=st}re();let G=new fc(M,U);this.xr=G,this.getContext=function(){return U},this.getContextAttributes=function(){return U.getContextAttributes()},this.forceContextLoss=function(){let y=Ve.get("WEBGL_lose_context");y&&y.loseContext()},this.forceContextRestore=function(){let y=Ve.get("WEBGL_lose_context");y&&y.restoreContext()},this.getPixelRatio=function(){return W},this.setPixelRatio=function(y){y!==void 0&&(W=y,this.setSize(q,te,!1))},this.getSize=function(y){return y.set(q,te)},this.setSize=function(y,I,B=!0){if(G.isPresenting){console.warn("THREE.WebGLRenderer: Can't change size while VR device is presenting.");return}q=y,te=I,t.width=Math.floor(y*W),t.height=Math.floor(I*W),B===!0&&(t.style.width=y+"px",t.style.height=I+"px"),this.setViewport(0,0,y,I)},this.getDrawingBufferSize=function(y){return y.set(q*W,te*W).floor()},this.setDrawingBufferSize=function(y,I,B){q=y,te=I,W=B,t.width=Math.floor(y*B),t.height=Math.floor(I*B),this.setViewport(0,0,y,I)},this.getCurrentViewport=function(y){return y.copy(R)},this.getViewport=function(y){return y.copy(Me)},this.setViewport=function(y,I,B,k){y.isVector4?Me.set(y.x,y.y,y.z,y.w):Me.set(y,I,B,k),Ee.viewport(R.copy(Me).multiplyScalar(W).round())},this.getScissor=function(y){return y.copy(Be)},this.setScissor=function(y,I,B,k){y.isVector4?Be.set(y.x,y.y,y.z,y.w):Be.set(y,I,B,k),Ee.scissor(V.copy(Be).multiplyScalar(W).round())},this.getScissorTest=function(){return tt},this.setScissorTest=function(y){Ee.setScissorTest(tt=y)},this.setOpaqueSort=function(y){se=y},this.setTransparentSort=function(y){fe=y},this.getClearColor=function(y){return y.copy(Ae.getClearColor())},this.setClearColor=function(){Ae.setClearColor.apply(Ae,arguments)},this.getClearAlpha=function(){return Ae.getClearAlpha()},this.setClearAlpha=function(){Ae.setClearAlpha.apply(Ae,arguments)},this.clear=function(y=!0,I=!0,B=!0){let k=0;if(y){let L=!1;if(D!==null){let ee=D.texture.format;L=ee===Lc||ee===Ic||ee===Pc}if(L){let ee=D.texture.type,ce=ee===Nn||ee===_i||ee===Hr||ee===lr||ee===Cc||ee===Rc,me=Ae.getClearColor(),ge=Ae.getClearAlpha(),Pe=me.r,De=me.g,xe=me.b;ce?(g[0]=Pe,g[1]=De,g[2]=xe,g[3]=ge,U.clearBufferuiv(U.COLOR,0,g)):(_[0]=Pe,_[1]=De,_[2]=xe,_[3]=ge,U.clearBufferiv(U.COLOR,0,_))}else k|=U.COLOR_BUFFER_BIT}I&&(k|=U.DEPTH_BUFFER_BIT),B&&(k|=U.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),U.clear(k)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.dispose=function(){t.removeEventListener("webglcontextlost",K,!1),t.removeEventListener("webglcontextrestored",ue,!1),t.removeEventListener("webglcontextcreationerror",le,!1),he.dispose(),qe.dispose(),be.dispose(),x.dispose(),F.dispose(),Y.dispose(),nt.dispose(),P.dispose(),ve.dispose(),G.dispose(),G.removeEventListener("sessionstart",eu),G.removeEventListener("sessionend",tu),ii.stop()};function K(y){y.preventDefault(),console.log("THREE.WebGLRenderer: Context Lost."),N=!0}function ue(){console.log("THREE.WebGLRenderer: Context Restored."),N=!1;let y=st.autoReset,I=de.enabled,B=de.autoUpdate,k=de.needsUpdate,L=de.type;re(),st.autoReset=y,de.enabled=I,de.autoUpdate=B,de.needsUpdate=k,de.type=L}function le(y){console.error("THREE.WebGLRenderer: A WebGL context could not be created. Reason: ",y.statusMessage)}function Le(y){let I=y.target;I.removeEventListener("dispose",Le),ft(I)}function ft(y){At(y),be.remove(y)}function At(y){let I=be.get(y).programs;I!==void 0&&(I.forEach(function(B){ve.releaseProgram(B)}),y.isShaderMaterial&&ve.releaseShaderCache(y))}this.renderBufferDirect=function(y,I,B,k,L,ee){I===null&&(I=ut);let ce=L.isMesh&&L.matrixWorld.determinant()<0,me=fd(y,I,B,k,L);Ee.setMaterial(k,ce);let ge=B.index,Pe=1;if(k.wireframe===!0){if(ge=j.getWireframeAttribute(B),ge===void 0)return;Pe=2}let De=B.drawRange,xe=B.attributes.position,$e=De.start*Pe,it=(De.start+De.count)*Pe;ee!==null&&($e=Math.max($e,ee.start*Pe),it=Math.min(it,(ee.start+ee.count)*Pe)),ge!==null?($e=Math.max($e,0),it=Math.min(it,ge.count)):xe!=null&&($e=Math.max($e,0),it=Math.min(it,xe.count));let at=it-$e;if(at<0||at===1/0)return;nt.setup(L,k,me,B,ge);let Nt,Ze=pe;if(ge!==null&&(Nt=Z.get(ge),Ze=We,Ze.setIndex(Nt)),L.isMesh)k.wireframe===!0?(Ee.setLineWidth(k.wireframeLinewidth*pt()),Ze.setMode(U.LINES)):Ze.setMode(U.TRIANGLES);else if(L.isLine){let Se=k.linewidth;Se===void 0&&(Se=1),Ee.setLineWidth(Se*pt()),L.isLineSegments?Ze.setMode(U.LINES):L.isLineLoop?Ze.setMode(U.LINE_LOOP):Ze.setMode(U.LINE_STRIP)}else L.isPoints?Ze.setMode(U.POINTS):L.isSprite&&Ze.setMode(U.TRIANGLES);if(L.isBatchedMesh)if(L._multiDrawInstances!==null)Ze.renderMultiDrawInstances(L._multiDrawStarts,L._multiDrawCounts,L._multiDrawCount,L._multiDrawInstances);else if(Ve.get("WEBGL_multi_draw"))Ze.renderMultiDraw(L._multiDrawStarts,L._multiDrawCounts,L._multiDrawCount);else{let Se=L._multiDrawStarts,Sn=L._multiDrawCounts,Ke=L._multiDrawCount,Qt=ge?Z.get(ge).bytesPerElement:1,Li=be.get(k).currentProgram.getUniforms();for(let Bt=0;Bt<Ke;Bt++)Li.setValue(U,"_gl_DrawID",Bt),Ze.render(Se[Bt]/Qt,Sn[Bt])}else if(L.isInstancedMesh)Ze.renderInstances($e,at,L.count);else if(B.isInstancedBufferGeometry){let Se=B._maxInstanceCount!==void 0?B._maxInstanceCount:1/0,Sn=Math.min(B.instanceCount,Se);Ze.renderInstances($e,at,Sn)}else Ze.render($e,at)};function Je(y,I,B){y.transparent===!0&&y.side===In&&y.forceSinglePass===!1?(y.side=Ot,y.needsUpdate=!0,es(y,I,B),y.side=ei,y.needsUpdate=!0,es(y,I,B),y.side=In):es(y,I,B)}this.compile=function(y,I,B=null){B===null&&(B=y),h=qe.get(B),h.init(I),w.push(h),B.traverseVisible(function(L){L.isLight&&L.layers.test(I.layers)&&(h.pushLight(L),L.castShadow&&h.pushShadow(L))}),y!==B&&y.traverseVisible(function(L){L.isLight&&L.layers.test(I.layers)&&(h.pushLight(L),L.castShadow&&h.pushShadow(L))}),h.setupLights();let k=new Set;return y.traverse(function(L){if(!(L.isMesh||L.isPoints||L.isLine||L.isSprite))return;let ee=L.material;if(ee)if(Array.isArray(ee))for(let ce=0;ce<ee.length;ce++){let me=ee[ce];Je(me,B,L),k.add(me)}else Je(ee,B,L),k.add(ee)}),w.pop(),h=null,k},this.compileAsync=function(y,I,B=null){let k=this.compile(y,I,B);return new Promise(L=>{function ee(){if(k.forEach(function(ce){be.get(ce).currentProgram.isReady()&&k.delete(ce)}),k.size===0){L(y);return}setTimeout(ee,10)}Ve.get("KHR_parallel_shader_compile")!==null?ee():setTimeout(ee,10)})};let jt=null;function vn(y){jt&&jt(y)}function eu(){ii.stop()}function tu(){ii.start()}let ii=new _h;ii.setAnimationLoop(vn),typeof self<"u"&&ii.setContext(self),this.setAnimationLoop=function(y){jt=y,G.setAnimationLoop(y),y===null?ii.stop():ii.start()},G.addEventListener("sessionstart",eu),G.addEventListener("sessionend",tu),this.render=function(y,I){if(I!==void 0&&I.isCamera!==!0){console.error("THREE.WebGLRenderer.render: camera is not an instance of THREE.Camera.");return}if(N===!0)return;if(y.matrixWorldAutoUpdate===!0&&y.updateMatrixWorld(),I.parent===null&&I.matrixWorldAutoUpdate===!0&&I.updateMatrixWorld(),G.enabled===!0&&G.isPresenting===!0&&(G.cameraAutoUpdate===!0&&G.updateCamera(I),I=G.getCamera()),y.isScene===!0&&y.onBeforeRender(M,y,I,D),h=qe.get(y,w.length),h.init(I),w.push(h),Ce.multiplyMatrices(I.projectionMatrix,I.matrixWorldInverse),$.setFromProjectionMatrix(Ce),_e=this.localClippingEnabled,ne=Q.init(this.clippingPlanes,_e),m=he.get(y,T.length),m.init(),T.push(m),G.enabled===!0&&G.isPresenting===!0){let ee=M.xr.getDepthSensingMesh();ee!==null&&Ca(ee,I,-1/0,M.sortObjects)}Ca(y,I,0,M.sortObjects),m.finish(),M.sortObjects===!0&&m.sort(se,fe),Xe=G.enabled===!1||G.isPresenting===!1||G.hasDepthSensing()===!1,Xe&&Ae.addToRenderList(m,y),this.info.render.frame++,ne===!0&&Q.beginShadows();let B=h.state.shadowsArray;de.render(B,y,I),ne===!0&&Q.endShadows(),this.info.autoReset===!0&&this.info.reset();let k=m.opaque,L=m.transmissive;if(h.setupLights(),I.isArrayCamera){let ee=I.cameras;if(L.length>0)for(let ce=0,me=ee.length;ce<me;ce++){let ge=ee[ce];iu(k,L,y,ge)}Xe&&Ae.render(y);for(let ce=0,me=ee.length;ce<me;ce++){let ge=ee[ce];nu(m,y,ge,ge.viewport)}}else L.length>0&&iu(k,L,y,I),Xe&&Ae.render(y),nu(m,y,I);D!==null&&(E.updateMultisampleRenderTarget(D),E.updateRenderTargetMipmap(D)),y.isScene===!0&&y.onAfterRender(M,y,I),nt.resetDefaultState(),b=-1,S=null,w.pop(),w.length>0?(h=w[w.length-1],ne===!0&&Q.setGlobalState(M.clippingPlanes,h.state.camera)):h=null,T.pop(),T.length>0?m=T[T.length-1]:m=null};function Ca(y,I,B,k){if(y.visible===!1)return;if(y.layers.test(I.layers)){if(y.isGroup)B=y.renderOrder;else if(y.isLOD)y.autoUpdate===!0&&y.update(I);else if(y.isLight)h.pushLight(y),y.castShadow&&h.pushShadow(y);else if(y.isSprite){if(!y.frustumCulled||$.intersectsSprite(y)){k&&ke.setFromMatrixPosition(y.matrixWorld).applyMatrix4(Ce);let ce=Y.update(y),me=y.material;me.visible&&m.push(y,ce,me,B,ke.z,null)}}else if((y.isMesh||y.isLine||y.isPoints)&&(!y.frustumCulled||$.intersectsObject(y))){let ce=Y.update(y),me=y.material;if(k&&(y.boundingSphere!==void 0?(y.boundingSphere===null&&y.computeBoundingSphere(),ke.copy(y.boundingSphere.center)):(ce.boundingSphere===null&&ce.computeBoundingSphere(),ke.copy(ce.boundingSphere.center)),ke.applyMatrix4(y.matrixWorld).applyMatrix4(Ce)),Array.isArray(me)){let ge=ce.groups;for(let Pe=0,De=ge.length;Pe<De;Pe++){let xe=ge[Pe],$e=me[xe.materialIndex];$e&&$e.visible&&m.push(y,ce,$e,B,ke.z,xe)}}else me.visible&&m.push(y,ce,me,B,ke.z,null)}}let ee=y.children;for(let ce=0,me=ee.length;ce<me;ce++)Ca(ee[ce],I,B,k)}function nu(y,I,B,k){let L=y.opaque,ee=y.transmissive,ce=y.transparent;h.setupLightsView(B),ne===!0&&Q.setGlobalState(M.clippingPlanes,B),k&&Ee.viewport(R.copy(k)),L.length>0&&Qr(L,I,B),ee.length>0&&Qr(ee,I,B),ce.length>0&&Qr(ce,I,B),Ee.buffers.depth.setTest(!0),Ee.buffers.depth.setMask(!0),Ee.buffers.color.setMask(!0),Ee.setPolygonOffset(!1)}function iu(y,I,B,k){if((B.isScene===!0?B.overrideMaterial:null)!==null)return;h.state.transmissionRenderTarget[k.id]===void 0&&(h.state.transmissionRenderTarget[k.id]=new Fn(1,1,{generateMipmaps:!0,type:Ve.has("EXT_color_buffer_half_float")||Ve.has("EXT_color_buffer_float")?$r:Nn,minFilter:xi,samples:4,stencilBuffer:s,resolveDepthBuffer:!1,resolveStencilBuffer:!1,colorSpace:Ye.workingColorSpace}));let ee=h.state.transmissionRenderTarget[k.id],ce=k.viewport||R;ee.setSize(ce.z,ce.w);let me=M.getRenderTarget();M.setRenderTarget(ee),M.getClearColor(X),J=M.getClearAlpha(),J<1&&M.setClearColor(16777215,.5),M.clear(),Xe&&Ae.render(B);let ge=M.toneMapping;M.toneMapping=Qn;let Pe=k.viewport;if(k.viewport!==void 0&&(k.viewport=void 0),h.setupLightsView(k),ne===!0&&Q.setGlobalState(M.clippingPlanes,k),Qr(y,B,k),E.updateMultisampleRenderTarget(ee),E.updateRenderTargetMipmap(ee),Ve.has("WEBGL_multisampled_render_to_texture")===!1){let De=!1;for(let xe=0,$e=I.length;xe<$e;xe++){let it=I[xe],at=it.object,Nt=it.geometry,Ze=it.material,Se=it.group;if(Ze.side===In&&at.layers.test(k.layers)){let Sn=Ze.side;Ze.side=Ot,Ze.needsUpdate=!0,ru(at,B,k,Nt,Ze,Se),Ze.side=Sn,Ze.needsUpdate=!0,De=!0}}De===!0&&(E.updateMultisampleRenderTarget(ee),E.updateRenderTargetMipmap(ee))}M.setRenderTarget(me),M.setClearColor(X,J),Pe!==void 0&&(k.viewport=Pe),M.toneMapping=ge}function Qr(y,I,B){let k=I.isScene===!0?I.overrideMaterial:null;for(let L=0,ee=y.length;L<ee;L++){let ce=y[L],me=ce.object,ge=ce.geometry,Pe=k===null?ce.material:k,De=ce.group;me.layers.test(B.layers)&&ru(me,I,B,ge,Pe,De)}}function ru(y,I,B,k,L,ee){y.onBeforeRender(M,I,B,k,L,ee),y.modelViewMatrix.multiplyMatrices(B.matrixWorldInverse,y.matrixWorld),y.normalMatrix.getNormalMatrix(y.modelViewMatrix),L.onBeforeRender(M,I,B,k,y,ee),L.transparent===!0&&L.side===In&&L.forceSinglePass===!1?(L.side=Ot,L.needsUpdate=!0,M.renderBufferDirect(B,I,k,L,y,ee),L.side=ei,L.needsUpdate=!0,M.renderBufferDirect(B,I,k,L,y,ee),L.side=In):M.renderBufferDirect(B,I,k,L,y,ee),y.onAfterRender(M,I,B,k,L,ee)}function es(y,I,B){I.isScene!==!0&&(I=ut);let k=be.get(y),L=h.state.lights,ee=h.state.shadowsArray,ce=L.state.version,me=ve.getParameters(y,L.state,ee,I,B),ge=ve.getProgramCacheKey(me),Pe=k.programs;k.environment=y.isMeshStandardMaterial?I.environment:null,k.fog=I.fog,k.envMap=(y.isMeshStandardMaterial?F:x).get(y.envMap||k.environment),k.envMapRotation=k.environment!==null&&y.envMap===null?I.environmentRotation:y.envMapRotation,Pe===void 0&&(y.addEventListener("dispose",Le),Pe=new Map,k.programs=Pe);let De=Pe.get(ge);if(De!==void 0){if(k.currentProgram===De&&k.lightsStateVersion===ce)return au(y,me),De}else me.uniforms=ve.getUniforms(y),y.onBeforeCompile(me,M),De=ve.acquireProgram(me,ge),Pe.set(ge,De),k.uniforms=me.uniforms;let xe=k.uniforms;return(!y.isShaderMaterial&&!y.isRawShaderMaterial||y.clipping===!0)&&(xe.clippingPlanes=Q.uniform),au(y,me),k.needsLights=dd(y),k.lightsStateVersion=ce,k.needsLights&&(xe.ambientLightColor.value=L.state.ambient,xe.lightProbe.value=L.state.probe,xe.directionalLights.value=L.state.directional,xe.directionalLightShadows.value=L.state.directionalShadow,xe.spotLights.value=L.state.spot,xe.spotLightShadows.value=L.state.spotShadow,xe.rectAreaLights.value=L.state.rectArea,xe.ltc_1.value=L.state.rectAreaLTC1,xe.ltc_2.value=L.state.rectAreaLTC2,xe.pointLights.value=L.state.point,xe.pointLightShadows.value=L.state.pointShadow,xe.hemisphereLights.value=L.state.hemi,xe.directionalShadowMap.value=L.state.directionalShadowMap,xe.directionalShadowMatrix.value=L.state.directionalShadowMatrix,xe.spotShadowMap.value=L.state.spotShadowMap,xe.spotLightMatrix.value=L.state.spotLightMatrix,xe.spotLightMap.value=L.state.spotLightMap,xe.pointShadowMap.value=L.state.pointShadowMap,xe.pointShadowMatrix.value=L.state.pointShadowMatrix),k.currentProgram=De,k.uniformsList=null,De}function su(y){if(y.uniformsList===null){let I=y.currentProgram.getUniforms();y.uniformsList=rr.seqWithValue(I.seq,y.uniforms)}return y.uniformsList}function au(y,I){let B=be.get(y);B.outputColorSpace=I.outputColorSpace,B.batching=I.batching,B.batchingColor=I.batchingColor,B.instancing=I.instancing,B.instancingColor=I.instancingColor,B.instancingMorph=I.instancingMorph,B.skinning=I.skinning,B.morphTargets=I.morphTargets,B.morphNormals=I.morphNormals,B.morphColors=I.morphColors,B.morphTargetsCount=I.morphTargetsCount,B.numClippingPlanes=I.numClippingPlanes,B.numIntersection=I.numClipIntersection,B.vertexAlphas=I.vertexAlphas,B.vertexTangents=I.vertexTangents,B.toneMapping=I.toneMapping}function fd(y,I,B,k,L){I.isScene!==!0&&(I=ut),E.resetTextureUnits();let ee=I.fog,ce=k.isMeshStandardMaterial?I.environment:null,me=D===null?M.outputColorSpace:D.isXRRenderTarget===!0?D.texture.colorSpace:mr,ge=(k.isMeshStandardMaterial?F:x).get(k.envMap||ce),Pe=k.vertexColors===!0&&!!B.attributes.color&&B.attributes.color.itemSize===4,De=!!B.attributes.tangent&&(!!k.normalMap||k.anisotropy>0),xe=!!B.morphAttributes.position,$e=!!B.morphAttributes.normal,it=!!B.morphAttributes.color,at=Qn;k.toneMapped&&(D===null||D.isXRRenderTarget===!0)&&(at=M.toneMapping);let Nt=B.morphAttributes.position||B.morphAttributes.normal||B.morphAttributes.color,Ze=Nt!==void 0?Nt.length:0,Se=be.get(k),Sn=h.state.lights;if(ne===!0&&(_e===!0||y!==S)){let qt=y===S&&k.id===b;Q.setState(k,y,qt)}let Ke=!1;k.version===Se.__version?(Se.needsLights&&Se.lightsStateVersion!==Sn.state.version||Se.outputColorSpace!==me||L.isBatchedMesh&&Se.batching===!1||!L.isBatchedMesh&&Se.batching===!0||L.isBatchedMesh&&Se.batchingColor===!0&&L.colorTexture===null||L.isBatchedMesh&&Se.batchingColor===!1&&L.colorTexture!==null||L.isInstancedMesh&&Se.instancing===!1||!L.isInstancedMesh&&Se.instancing===!0||L.isSkinnedMesh&&Se.skinning===!1||!L.isSkinnedMesh&&Se.skinning===!0||L.isInstancedMesh&&Se.instancingColor===!0&&L.instanceColor===null||L.isInstancedMesh&&Se.instancingColor===!1&&L.instanceColor!==null||L.isInstancedMesh&&Se.instancingMorph===!0&&L.morphTexture===null||L.isInstancedMesh&&Se.instancingMorph===!1&&L.morphTexture!==null||Se.envMap!==ge||k.fog===!0&&Se.fog!==ee||Se.numClippingPlanes!==void 0&&(Se.numClippingPlanes!==Q.numPlanes||Se.numIntersection!==Q.numIntersection)||Se.vertexAlphas!==Pe||Se.vertexTangents!==De||Se.morphTargets!==xe||Se.morphNormals!==$e||Se.morphColors!==it||Se.toneMapping!==at||Se.morphTargetsCount!==Ze)&&(Ke=!0):(Ke=!0,Se.__version=k.version);let Qt=Se.currentProgram;Ke===!0&&(Qt=es(k,I,L));let Li=!1,Bt=!1,yr=!1,ot=Qt.getUniforms(),dn=Se.uniforms;if(Ee.useProgram(Qt.program)&&(Li=!0,Bt=!0,yr=!0),k.id!==b&&(b=k.id,Bt=!0),Li||S!==y){Ee.buffers.depth.getReversed()?(ae.copy(y.projectionMatrix),qp(ae),Yp(ae),ot.setValue(U,"projectionMatrix",ae)):ot.setValue(U,"projectionMatrix",y.projectionMatrix),ot.setValue(U,"viewMatrix",y.matrixWorldInverse);let zn=ot.map.cameraPosition;zn!==void 0&&zn.setValue(U,Ie.setFromMatrixPosition(y.matrixWorld)),Ge.logarithmicDepthBuffer&&ot.setValue(U,"logDepthBufFC",2/(Math.log(y.far+1)/Math.LN2)),(k.isMeshPhongMaterial||k.isMeshToonMaterial||k.isMeshLambertMaterial||k.isMeshBasicMaterial||k.isMeshStandardMaterial||k.isShaderMaterial)&&ot.setValue(U,"isOrthographic",y.isOrthographicCamera===!0),S!==y&&(S=y,Bt=!0,yr=!0)}if(L.isSkinnedMesh){ot.setOptional(U,L,"bindMatrix"),ot.setOptional(U,L,"bindMatrixInverse");let qt=L.skeleton;qt&&(qt.boneTexture===null&&qt.computeBoneTexture(),ot.setValue(U,"boneTexture",qt.boneTexture,E))}L.isBatchedMesh&&(ot.setOptional(U,L,"batchingTexture"),ot.setValue(U,"batchingTexture",L._matricesTexture,E),ot.setOptional(U,L,"batchingIdTexture"),ot.setValue(U,"batchingIdTexture",L._indirectTexture,E),ot.setOptional(U,L,"batchingColorTexture"),L._colorsTexture!==null&&ot.setValue(U,"batchingColorTexture",L._colorsTexture,E));let vr=B.morphAttributes;if((vr.position!==void 0||vr.normal!==void 0||vr.color!==void 0)&&Re.update(L,B,Qt),(Bt||Se.receiveShadow!==L.receiveShadow)&&(Se.receiveShadow=L.receiveShadow,ot.setValue(U,"receiveShadow",L.receiveShadow)),k.isMeshGouraudMaterial&&k.envMap!==null&&(dn.envMap.value=ge,dn.flipEnvMap.value=ge.isCubeTexture&&ge.isRenderTargetTexture===!1?-1:1),k.isMeshStandardMaterial&&k.envMap===null&&I.environment!==null&&(dn.envMapIntensity.value=I.environmentIntensity),Bt&&(ot.setValue(U,"toneMappingExposure",M.toneMappingExposure),Se.needsLights&&hd(dn,yr),ee&&k.fog===!0&&oe.refreshFogUniforms(dn,ee),oe.refreshMaterialUniforms(dn,k,W,te,h.state.transmissionRenderTarget[y.id]),rr.upload(U,su(Se),dn,E)),k.isShaderMaterial&&k.uniformsNeedUpdate===!0&&(rr.upload(U,su(Se),dn,E),k.uniformsNeedUpdate=!1),k.isSpriteMaterial&&ot.setValue(U,"center",L.center),ot.setValue(U,"modelViewMatrix",L.modelViewMatrix),ot.setValue(U,"normalMatrix",L.normalMatrix),ot.setValue(U,"modelMatrix",L.matrixWorld),k.isShaderMaterial||k.isRawShaderMaterial){let qt=k.uniformsGroups;for(let zn=0,Hn=qt.length;zn<Hn;zn++){let ou=qt[zn];P.update(ou,Qt),P.bind(ou,Qt)}}return Qt}function hd(y,I){y.ambientLightColor.needsUpdate=I,y.lightProbe.needsUpdate=I,y.directionalLights.needsUpdate=I,y.directionalLightShadows.needsUpdate=I,y.pointLights.needsUpdate=I,y.pointLightShadows.needsUpdate=I,y.spotLights.needsUpdate=I,y.spotLightShadows.needsUpdate=I,y.rectAreaLights.needsUpdate=I,y.hemisphereLights.needsUpdate=I}function dd(y){return y.isMeshLambertMaterial||y.isMeshToonMaterial||y.isMeshPhongMaterial||y.isMeshStandardMaterial||y.isShadowMaterial||y.isShaderMaterial&&y.lights===!0}this.getActiveCubeFace=function(){return A},this.getActiveMipmapLevel=function(){return C},this.getRenderTarget=function(){return D},this.setRenderTargetTextures=function(y,I,B){be.get(y.texture).__webglTexture=I,be.get(y.depthTexture).__webglTexture=B;let k=be.get(y);k.__hasExternalTextures=!0,k.__autoAllocateDepthBuffer=B===void 0,k.__autoAllocateDepthBuffer||Ve.has("WEBGL_multisampled_render_to_texture")===!0&&(console.warn("THREE.WebGLRenderer: Render-to-texture extension was disabled because an external texture was provided"),k.__useRenderToTexture=!1)},this.setRenderTargetFramebuffer=function(y,I){let B=be.get(y);B.__webglFramebuffer=I,B.__useDefaultFramebuffer=I===void 0},this.setRenderTarget=function(y,I=0,B=0){D=y,A=I,C=B;let k=!0,L=null,ee=!1,ce=!1;if(y){let ge=be.get(y);if(ge.__useDefaultFramebuffer!==void 0)Ee.bindFramebuffer(U.FRAMEBUFFER,null),k=!1;else if(ge.__webglFramebuffer===void 0)E.setupRenderTarget(y);else if(ge.__hasExternalTextures)E.rebindTextures(y,be.get(y.texture).__webglTexture,be.get(y.depthTexture).__webglTexture);else if(y.depthBuffer){let xe=y.depthTexture;if(ge.__boundDepthTexture!==xe){if(xe!==null&&be.has(xe)&&(y.width!==xe.image.width||y.height!==xe.image.height))throw new Error("WebGLRenderTarget: Attached DepthTexture is initialized to the incorrect size.");E.setupDepthRenderbuffer(y)}}let Pe=y.texture;(Pe.isData3DTexture||Pe.isDataArrayTexture||Pe.isCompressedArrayTexture)&&(ce=!0);let De=be.get(y).__webglFramebuffer;y.isWebGLCubeRenderTarget?(Array.isArray(De[I])?L=De[I][B]:L=De[I],ee=!0):y.samples>0&&E.useMultisampledRTT(y)===!1?L=be.get(y).__webglMultisampledFramebuffer:Array.isArray(De)?L=De[B]:L=De,R.copy(y.viewport),V.copy(y.scissor),z=y.scissorTest}else R.copy(Me).multiplyScalar(W).floor(),V.copy(Be).multiplyScalar(W).floor(),z=tt;if(Ee.bindFramebuffer(U.FRAMEBUFFER,L)&&k&&Ee.drawBuffers(y,L),Ee.viewport(R),Ee.scissor(V),Ee.setScissorTest(z),ee){let ge=be.get(y.texture);U.framebufferTexture2D(U.FRAMEBUFFER,U.COLOR_ATTACHMENT0,U.TEXTURE_CUBE_MAP_POSITIVE_X+I,ge.__webglTexture,B)}else if(ce){let ge=be.get(y.texture),Pe=I||0;U.framebufferTextureLayer(U.FRAMEBUFFER,U.COLOR_ATTACHMENT0,ge.__webglTexture,B||0,Pe)}b=-1},this.readRenderTargetPixels=function(y,I,B,k,L,ee,ce){if(!(y&&y.isWebGLRenderTarget)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");return}let me=be.get(y).__webglFramebuffer;if(y.isWebGLCubeRenderTarget&&ce!==void 0&&(me=me[ce]),me){Ee.bindFramebuffer(U.FRAMEBUFFER,me);try{let ge=y.texture,Pe=ge.format,De=ge.type;if(!Ge.textureFormatReadable(Pe)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.");return}if(!Ge.textureTypeReadable(De)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.");return}I>=0&&I<=y.width-k&&B>=0&&B<=y.height-L&&U.readPixels(I,B,k,L,Oe.convert(Pe),Oe.convert(De),ee)}finally{let ge=D!==null?be.get(D).__webglFramebuffer:null;Ee.bindFramebuffer(U.FRAMEBUFFER,ge)}}},this.readRenderTargetPixelsAsync=async function(y,I,B,k,L,ee,ce){if(!(y&&y.isWebGLRenderTarget))throw new Error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");let me=be.get(y).__webglFramebuffer;if(y.isWebGLCubeRenderTarget&&ce!==void 0&&(me=me[ce]),me){let ge=y.texture,Pe=ge.format,De=ge.type;if(!Ge.textureFormatReadable(Pe))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in RGBA or implementation defined format.");if(!Ge.textureTypeReadable(De))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in UnsignedByteType or implementation defined type.");if(I>=0&&I<=y.width-k&&B>=0&&B<=y.height-L){Ee.bindFramebuffer(U.FRAMEBUFFER,me);let xe=U.createBuffer();U.bindBuffer(U.PIXEL_PACK_BUFFER,xe),U.bufferData(U.PIXEL_PACK_BUFFER,ee.byteLength,U.STREAM_READ),U.readPixels(I,B,k,L,Oe.convert(Pe),Oe.convert(De),0);let $e=D!==null?be.get(D).__webglFramebuffer:null;Ee.bindFramebuffer(U.FRAMEBUFFER,$e);let it=U.fenceSync(U.SYNC_GPU_COMMANDS_COMPLETE,0);return U.flush(),await Xp(U,it,4),U.bindBuffer(U.PIXEL_PACK_BUFFER,xe),U.getBufferSubData(U.PIXEL_PACK_BUFFER,0,ee),U.deleteBuffer(xe),U.deleteSync(it),ee}else throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: requested read bounds are out of range.")}},this.copyFramebufferToTexture=function(y,I=null,B=0){y.isTexture!==!0&&(Or("WebGLRenderer: copyFramebufferToTexture function signature has changed."),I=arguments[0]||null,y=arguments[1]);let k=Math.pow(2,-B),L=Math.floor(y.image.width*k),ee=Math.floor(y.image.height*k),ce=I!==null?I.x:0,me=I!==null?I.y:0;E.setTexture2D(y,0),U.copyTexSubImage2D(U.TEXTURE_2D,B,0,0,ce,me,L,ee),Ee.unbindTexture()},this.copyTextureToTexture=function(y,I,B=null,k=null,L=0){y.isTexture!==!0&&(Or("WebGLRenderer: copyTextureToTexture function signature has changed."),k=arguments[0]||null,y=arguments[1],I=arguments[2],L=arguments[3]||0,B=null);let ee,ce,me,ge,Pe,De,xe,$e,it,at=y.isCompressedTexture?y.mipmaps[L]:y.image;B!==null?(ee=B.max.x-B.min.x,ce=B.max.y-B.min.y,me=B.isBox3?B.max.z-B.min.z:1,ge=B.min.x,Pe=B.min.y,De=B.isBox3?B.min.z:0):(ee=at.width,ce=at.height,me=at.depth||1,ge=0,Pe=0,De=0),k!==null?(xe=k.x,$e=k.y,it=k.z):(xe=0,$e=0,it=0);let Nt=Oe.convert(I.format),Ze=Oe.convert(I.type),Se;I.isData3DTexture?(E.setTexture3D(I,0),Se=U.TEXTURE_3D):I.isDataArrayTexture||I.isCompressedArrayTexture?(E.setTexture2DArray(I,0),Se=U.TEXTURE_2D_ARRAY):(E.setTexture2D(I,0),Se=U.TEXTURE_2D),U.pixelStorei(U.UNPACK_FLIP_Y_WEBGL,I.flipY),U.pixelStorei(U.UNPACK_PREMULTIPLY_ALPHA_WEBGL,I.premultiplyAlpha),U.pixelStorei(U.UNPACK_ALIGNMENT,I.unpackAlignment);let Sn=U.getParameter(U.UNPACK_ROW_LENGTH),Ke=U.getParameter(U.UNPACK_IMAGE_HEIGHT),Qt=U.getParameter(U.UNPACK_SKIP_PIXELS),Li=U.getParameter(U.UNPACK_SKIP_ROWS),Bt=U.getParameter(U.UNPACK_SKIP_IMAGES);U.pixelStorei(U.UNPACK_ROW_LENGTH,at.width),U.pixelStorei(U.UNPACK_IMAGE_HEIGHT,at.height),U.pixelStorei(U.UNPACK_SKIP_PIXELS,ge),U.pixelStorei(U.UNPACK_SKIP_ROWS,Pe),U.pixelStorei(U.UNPACK_SKIP_IMAGES,De);let yr=y.isDataArrayTexture||y.isData3DTexture,ot=I.isDataArrayTexture||I.isData3DTexture;if(y.isRenderTargetTexture||y.isDepthTexture){let dn=be.get(y),vr=be.get(I),qt=be.get(dn.__renderTarget),zn=be.get(vr.__renderTarget);Ee.bindFramebuffer(U.READ_FRAMEBUFFER,qt.__webglFramebuffer),Ee.bindFramebuffer(U.DRAW_FRAMEBUFFER,zn.__webglFramebuffer);for(let Hn=0;Hn<me;Hn++)yr&&U.framebufferTextureLayer(U.READ_FRAMEBUFFER,U.COLOR_ATTACHMENT0,be.get(y).__webglTexture,L,De+Hn),y.isDepthTexture?(ot&&U.framebufferTextureLayer(U.DRAW_FRAMEBUFFER,U.COLOR_ATTACHMENT0,be.get(I).__webglTexture,L,it+Hn),U.blitFramebuffer(ge,Pe,ee,ce,xe,$e,ee,ce,U.DEPTH_BUFFER_BIT,U.NEAREST)):ot?U.copyTexSubImage3D(Se,L,xe,$e,it+Hn,ge,Pe,ee,ce):U.copyTexSubImage2D(Se,L,xe,$e,it+Hn,ge,Pe,ee,ce);Ee.bindFramebuffer(U.READ_FRAMEBUFFER,null),Ee.bindFramebuffer(U.DRAW_FRAMEBUFFER,null)}else ot?y.isDataTexture||y.isData3DTexture?U.texSubImage3D(Se,L,xe,$e,it,ee,ce,me,Nt,Ze,at.data):I.isCompressedArrayTexture?U.compressedTexSubImage3D(Se,L,xe,$e,it,ee,ce,me,Nt,at.data):U.texSubImage3D(Se,L,xe,$e,it,ee,ce,me,Nt,Ze,at):y.isDataTexture?U.texSubImage2D(U.TEXTURE_2D,L,xe,$e,ee,ce,Nt,Ze,at.data):y.isCompressedTexture?U.compressedTexSubImage2D(U.TEXTURE_2D,L,xe,$e,at.width,at.height,Nt,at.data):U.texSubImage2D(U.TEXTURE_2D,L,xe,$e,ee,ce,Nt,Ze,at);U.pixelStorei(U.UNPACK_ROW_LENGTH,Sn),U.pixelStorei(U.UNPACK_IMAGE_HEIGHT,Ke),U.pixelStorei(U.UNPACK_SKIP_PIXELS,Qt),U.pixelStorei(U.UNPACK_SKIP_ROWS,Li),U.pixelStorei(U.UNPACK_SKIP_IMAGES,Bt),L===0&&I.generateMipmaps&&U.generateMipmap(Se),Ee.unbindTexture()},this.copyTextureToTexture3D=function(y,I,B=null,k=null,L=0){return y.isTexture!==!0&&(Or("WebGLRenderer: copyTextureToTexture3D function signature has changed."),B=arguments[0]||null,k=arguments[1]||null,y=arguments[2],I=arguments[3],L=arguments[4]||0),Or('WebGLRenderer: copyTextureToTexture3D function has been deprecated. Use "copyTextureToTexture" instead.'),this.copyTextureToTexture(y,I,B,k,L)},this.initRenderTarget=function(y){be.get(y).__webglFramebuffer===void 0&&E.setupRenderTarget(y)},this.initTexture=function(y){y.isCubeTexture?E.setTextureCube(y,0):y.isData3DTexture?E.setTexture3D(y,0):y.isDataArrayTexture||y.isCompressedArrayTexture?E.setTexture2DArray(y,0):E.setTexture2D(y,0),Ee.unbindTexture()},this.resetState=function(){A=0,C=0,D=null,Ee.reset(),nt.reset()},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}get coordinateSystem(){return Dn}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(e){this._outputColorSpace=e;let t=this.getContext();t.drawingBufferColorspace=Ye._getDrawingBufferColorSpace(e),t.unpackColorSpace=Ye._getUnpackColorSpace()}};var sa=class extends Ut{constructor(){super(),this.isScene=!0,this.type="Scene",this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.backgroundRotation=new Zt,this.environmentIntensity=1,this.environmentRotation=new Zt,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}copy(e,t){return super.copy(e,t),e.background!==null&&(this.background=e.background.clone()),e.environment!==null&&(this.environment=e.environment.clone()),e.fog!==null&&(this.fog=e.fog.clone()),this.backgroundBlurriness=e.backgroundBlurriness,this.backgroundIntensity=e.backgroundIntensity,this.backgroundRotation.copy(e.backgroundRotation),this.environmentIntensity=e.environmentIntensity,this.environmentRotation.copy(e.environmentRotation),e.overrideMaterial!==null&&(this.overrideMaterial=e.overrideMaterial.clone()),this.matrixAutoUpdate=e.matrixAutoUpdate,this}toJSON(e){let t=super.toJSON(e);return this.fog!==null&&(t.object.fog=this.fog.toJSON()),this.backgroundBlurriness>0&&(t.object.backgroundBlurriness=this.backgroundBlurriness),this.backgroundIntensity!==1&&(t.object.backgroundIntensity=this.backgroundIntensity),t.object.backgroundRotation=this.backgroundRotation.toArray(),this.environmentIntensity!==1&&(t.object.environmentIntensity=this.environmentIntensity),t.object.environmentRotation=this.environmentRotation.toArray(),t}};var Si=class extends Gt{constructor(e,t,n,r,s,a,o,l,c){super(e,t,n,r,s,a,o,l,c),this.isCanvasTexture=!0,this.needsUpdate=!0}};var aa=class i extends cn{constructor(e=[new we(0,-.5),new we(.5,0),new we(0,.5)],t=12,n=0,r=Math.PI*2){super(),this.type="LatheGeometry",this.parameters={points:e,segments:t,phiStart:n,phiLength:r},t=Math.floor(t),r=Tt(r,0,Math.PI*2);let s=[],a=[],o=[],l=[],c=[],u=1/t,f=new O,d=new we,p=new O,g=new O,_=new O,m=0,h=0;for(let T=0;T<=e.length-1;T++)switch(T){case 0:m=e[T+1].x-e[T].x,h=e[T+1].y-e[T].y,p.x=h*1,p.y=-m,p.z=h*0,_.copy(p),p.normalize(),l.push(p.x,p.y,p.z);break;case e.length-1:l.push(_.x,_.y,_.z);break;default:m=e[T+1].x-e[T].x,h=e[T+1].y-e[T].y,p.x=h*1,p.y=-m,p.z=h*0,g.copy(p),p.x+=_.x,p.y+=_.y,p.z+=_.z,p.normalize(),l.push(p.x,p.y,p.z),_.copy(g)}for(let T=0;T<=t;T++){let w=n+T*u*r,M=Math.sin(w),N=Math.cos(w);for(let A=0;A<=e.length-1;A++){f.x=e[A].x*M,f.y=e[A].y,f.z=e[A].x*N,a.push(f.x,f.y,f.z),d.x=T/t,d.y=A/(e.length-1),o.push(d.x,d.y);let C=l[3*A+0]*M,D=l[3*A+1],b=l[3*A+0]*N;c.push(C,D,b)}}for(let T=0;T<t;T++)for(let w=0;w<e.length-1;w++){let M=w+T*e.length,N=M,A=M+e.length,C=M+e.length+1,D=M+1;s.push(N,A,D),s.push(C,D,A)}this.setIndex(s),this.setAttribute("position",new mt(a,3)),this.setAttribute("uv",new mt(o,2)),this.setAttribute("normal",new mt(c,3))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new i(e.points,e.segments,e.phiStart,e.phiLength)}};var Mi=class i extends cn{constructor(e=1,t=1,n=1,r=32,s=1,a=!1,o=0,l=Math.PI*2){super(),this.type="CylinderGeometry",this.parameters={radiusTop:e,radiusBottom:t,height:n,radialSegments:r,heightSegments:s,openEnded:a,thetaStart:o,thetaLength:l};let c=this;r=Math.floor(r),s=Math.floor(s);let u=[],f=[],d=[],p=[],g=0,_=[],m=n/2,h=0;T(),a===!1&&(e>0&&w(!0),t>0&&w(!1)),this.setIndex(u),this.setAttribute("position",new mt(f,3)),this.setAttribute("normal",new mt(d,3)),this.setAttribute("uv",new mt(p,2));function T(){let M=new O,N=new O,A=0,C=(t-e)/n;for(let D=0;D<=s;D++){let b=[],S=D/s,R=S*(t-e)+e;for(let V=0;V<=r;V++){let z=V/r,X=z*l+o,J=Math.sin(X),q=Math.cos(X);N.x=R*J,N.y=-S*n+m,N.z=R*q,f.push(N.x,N.y,N.z),M.set(J,C,q).normalize(),d.push(M.x,M.y,M.z),p.push(z,1-S),b.push(g++)}_.push(b)}for(let D=0;D<r;D++)for(let b=0;b<s;b++){let S=_[b][D],R=_[b+1][D],V=_[b+1][D+1],z=_[b][D+1];(e>0||b!==0)&&(u.push(S,R,z),A+=3),(t>0||b!==s-1)&&(u.push(R,V,z),A+=3)}c.addGroup(h,A,0),h+=A}function w(M){let N=g,A=new we,C=new O,D=0,b=M===!0?e:t,S=M===!0?1:-1;for(let V=1;V<=r;V++)f.push(0,m*S,0),d.push(0,S,0),p.push(.5,.5),g++;let R=g;for(let V=0;V<=r;V++){let X=V/r*l+o,J=Math.cos(X),q=Math.sin(X);C.x=b*q,C.y=m*S,C.z=b*J,f.push(C.x,C.y,C.z),d.push(0,S,0),A.x=J*.5+.5,A.y=q*.5*S+.5,p.push(A.x,A.y),g++}for(let V=0;V<r;V++){let z=N+V,X=R+V;M===!0?u.push(X,X+1,z):u.push(X+1,X,z),D+=3}c.addGroup(h,D,M===!0?1:2),h+=D}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new i(e.radiusTop,e.radiusBottom,e.height,e.radialSegments,e.heightSegments,e.openEnded,e.thetaStart,e.thetaLength)}},oa=class i extends Mi{constructor(e=1,t=1,n=32,r=1,s=!1,a=0,o=Math.PI*2){super(0,e,t,n,r,s,a,o),this.type="ConeGeometry",this.parameters={radius:e,height:t,radialSegments:n,heightSegments:r,openEnded:s,thetaStart:a,thetaLength:o}}static fromJSON(e){return new i(e.radius,e.height,e.radialSegments,e.heightSegments,e.openEnded,e.thetaStart,e.thetaLength)}};var la=class i extends cn{constructor(e=1,t=32,n=16,r=0,s=Math.PI*2,a=0,o=Math.PI){super(),this.type="SphereGeometry",this.parameters={radius:e,widthSegments:t,heightSegments:n,phiStart:r,phiLength:s,thetaStart:a,thetaLength:o},t=Math.max(3,Math.floor(t)),n=Math.max(2,Math.floor(n));let l=Math.min(a+o,Math.PI),c=0,u=[],f=new O,d=new O,p=[],g=[],_=[],m=[];for(let h=0;h<=n;h++){let T=[],w=h/n,M=0;h===0&&a===0?M=.5/t:h===n&&l===Math.PI&&(M=-.5/t);for(let N=0;N<=t;N++){let A=N/t;f.x=-e*Math.cos(r+A*s)*Math.sin(a+w*o),f.y=e*Math.cos(a+w*o),f.z=e*Math.sin(r+A*s)*Math.sin(a+w*o),g.push(f.x,f.y,f.z),d.copy(f).normalize(),_.push(d.x,d.y,d.z),m.push(A+M,1-w),T.push(c++)}u.push(T)}for(let h=0;h<n;h++)for(let T=0;T<t;T++){let w=u[h][T+1],M=u[h][T],N=u[h+1][T],A=u[h+1][T+1];(h!==0||a>0)&&p.push(w,M,A),(h!==n-1||l<Math.PI)&&p.push(M,N,A)}this.setIndex(p),this.setAttribute("position",new mt(g,3)),this.setAttribute("normal",new mt(_,3)),this.setAttribute("uv",new mt(m,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new i(e.radius,e.widthSegments,e.heightSegments,e.phiStart,e.phiLength,e.thetaStart,e.thetaLength)}};var dr=class i extends cn{constructor(e=1,t=.4,n=12,r=48,s=Math.PI*2){super(),this.type="TorusGeometry",this.parameters={radius:e,tube:t,radialSegments:n,tubularSegments:r,arc:s},n=Math.floor(n),r=Math.floor(r);let a=[],o=[],l=[],c=[],u=new O,f=new O,d=new O;for(let p=0;p<=n;p++)for(let g=0;g<=r;g++){let _=g/r*s,m=p/n*Math.PI*2;f.x=(e+t*Math.cos(m))*Math.cos(_),f.y=(e+t*Math.cos(m))*Math.sin(_),f.z=t*Math.sin(m),o.push(f.x,f.y,f.z),u.x=e*Math.cos(_),u.y=e*Math.sin(_),d.subVectors(f,u).normalize(),l.push(d.x,d.y,d.z),c.push(g/r),c.push(p/n)}for(let p=1;p<=n;p++)for(let g=1;g<=r;g++){let _=(r+1)*p+g-1,m=(r+1)*(p-1)+g-1,h=(r+1)*(p-1)+g,T=(r+1)*p+g;a.push(_,m,T),a.push(m,h,T)}this.setIndex(a),this.setAttribute("position",new mt(o,3)),this.setAttribute("normal",new mt(l,3)),this.setAttribute("uv",new mt(c,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new i(e.radius,e.tube,e.radialSegments,e.tubularSegments,e.arc)}};var vt=class extends vi{static get type(){return"MeshStandardMaterial"}constructor(e){super(),this.isMeshStandardMaterial=!0,this.defines={STANDARD:""},this.color=new ze(16777215),this.roughness=1,this.metalness=0,this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new ze(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=hh,this.normalScale=new we(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.roughnessMap=null,this.metalnessMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new Zt,this.envMapIntensity=1,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.flatShading=!1,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.defines={STANDARD:""},this.color.copy(e.color),this.roughness=e.roughness,this.metalness=e.metalness,this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.emissive.copy(e.emissive),this.emissiveMap=e.emissiveMap,this.emissiveIntensity=e.emissiveIntensity,this.bumpMap=e.bumpMap,this.bumpScale=e.bumpScale,this.normalMap=e.normalMap,this.normalMapType=e.normalMapType,this.normalScale.copy(e.normalScale),this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.roughnessMap=e.roughnessMap,this.metalnessMap=e.metalnessMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.envMapIntensity=e.envMapIntensity,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.flatShading=e.flatShading,this.fog=e.fog,this}};function ks(i,e,t){return!i||!t&&i.constructor===e?i:typeof e.BYTES_PER_ELEMENT=="number"?new e(i):Array.prototype.slice.call(i)}function H_(i){return ArrayBuffer.isView(i)&&!(i instanceof DataView)}var pr=class{constructor(e,t,n,r){this.parameterPositions=e,this._cachedIndex=0,this.resultBuffer=r!==void 0?r:new t.constructor(n),this.sampleValues=t,this.valueSize=n,this.settings=null,this.DefaultSettings_={}}evaluate(e){let t=this.parameterPositions,n=this._cachedIndex,r=t[n],s=t[n-1];n:{e:{let a;t:{i:if(!(e<r)){for(let o=n+2;;){if(r===void 0){if(e<s)break i;return n=t.length,this._cachedIndex=n,this.copySampleValue_(n-1)}if(n===o)break;if(s=r,r=t[++n],e<r)break e}a=t.length;break t}if(!(e>=s)){let o=t[1];e<o&&(n=2,s=o);for(let l=n-2;;){if(s===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(n===l)break;if(r=s,s=t[--n-1],e>=s)break e}a=n,n=0;break t}break n}for(;n<a;){let o=n+a>>>1;e<t[o]?a=o:n=o+1}if(r=t[n],s=t[n-1],s===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(r===void 0)return n=t.length,this._cachedIndex=n,this.copySampleValue_(n-1)}this._cachedIndex=n,this.intervalChanged_(n,s,r)}return this.interpolate_(n,s,e,r)}getSettings_(){return this.settings||this.DefaultSettings_}copySampleValue_(e){let t=this.resultBuffer,n=this.sampleValues,r=this.valueSize,s=e*r;for(let a=0;a!==r;++a)t[a]=n[s+a];return t}interpolate_(){throw new Error("call to abstract method")}intervalChanged_(){}},hc=class extends pr{constructor(e,t,n,r){super(e,t,n,r),this._weightPrev=-0,this._offsetPrev=-0,this._weightNext=-0,this._offsetNext=-0,this.DefaultSettings_={endingStart:Ku,endingEnd:Ku}}intervalChanged_(e,t,n){let r=this.parameterPositions,s=e-2,a=e+1,o=r[s],l=r[a];if(o===void 0)switch(this.getSettings_().endingStart){case Ju:s=e,o=2*t-n;break;case ju:s=r.length-2,o=t+r[s]-r[s+1];break;default:s=e,o=n}if(l===void 0)switch(this.getSettings_().endingEnd){case Ju:a=e,l=2*n-t;break;case ju:a=1,l=n+r[1]-r[0];break;default:a=e-1,l=t}let c=(n-t)*.5,u=this.valueSize;this._weightPrev=c/(t-o),this._weightNext=c/(l-n),this._offsetPrev=s*u,this._offsetNext=a*u}interpolate_(e,t,n,r){let s=this.resultBuffer,a=this.sampleValues,o=this.valueSize,l=e*o,c=l-o,u=this._offsetPrev,f=this._offsetNext,d=this._weightPrev,p=this._weightNext,g=(n-t)/(r-t),_=g*g,m=_*g,h=-d*m+2*d*_-d*g,T=(1+d)*m+(-1.5-2*d)*_+(-.5+d)*g+1,w=(-1-p)*m+(1.5+p)*_+.5*g,M=p*m-p*_;for(let N=0;N!==o;++N)s[N]=h*a[u+N]+T*a[c+N]+w*a[l+N]+M*a[f+N];return s}},dc=class extends pr{constructor(e,t,n,r){super(e,t,n,r)}interpolate_(e,t,n,r){let s=this.resultBuffer,a=this.sampleValues,o=this.valueSize,l=e*o,c=l-o,u=(n-t)/(r-t),f=1-u;for(let d=0;d!==o;++d)s[d]=a[c+d]*f+a[l+d]*u;return s}},pc=class extends pr{constructor(e,t,n,r){super(e,t,n,r)}interpolate_(e){return this.copySampleValue_(e-1)}},un=class{constructor(e,t,n,r){if(e===void 0)throw new Error("THREE.KeyframeTrack: track name is undefined");if(t===void 0||t.length===0)throw new Error("THREE.KeyframeTrack: no keyframes in track named "+e);this.name=e,this.times=ks(t,this.TimeBufferType),this.values=ks(n,this.ValueBufferType),this.setInterpolation(r||this.DefaultInterpolation)}static toJSON(e){let t=e.constructor,n;if(t.toJSON!==this.toJSON)n=t.toJSON(e);else{n={name:e.name,times:ks(e.times,Array),values:ks(e.values,Array)};let r=e.getInterpolation();r!==e.DefaultInterpolation&&(n.interpolation=r)}return n.type=e.ValueTypeName,n}InterpolantFactoryMethodDiscrete(e){return new pc(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodLinear(e){return new dc(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodSmooth(e){return new hc(this.times,this.values,this.getValueSize(),e)}setInterpolation(e){let t;switch(e){case Xs:t=this.InterpolantFactoryMethodDiscrete;break;case Zl:t=this.InterpolantFactoryMethodLinear;break;case Oo:t=this.InterpolantFactoryMethodSmooth;break}if(t===void 0){let n="unsupported interpolation for "+this.ValueTypeName+" keyframe track named "+this.name;if(this.createInterpolant===void 0)if(e!==this.DefaultInterpolation)this.setInterpolation(this.DefaultInterpolation);else throw new Error(n);return console.warn("THREE.KeyframeTrack:",n),this}return this.createInterpolant=t,this}getInterpolation(){switch(this.createInterpolant){case this.InterpolantFactoryMethodDiscrete:return Xs;case this.InterpolantFactoryMethodLinear:return Zl;case this.InterpolantFactoryMethodSmooth:return Oo}}getValueSize(){return this.values.length/this.times.length}shift(e){if(e!==0){let t=this.times;for(let n=0,r=t.length;n!==r;++n)t[n]+=e}return this}scale(e){if(e!==1){let t=this.times;for(let n=0,r=t.length;n!==r;++n)t[n]*=e}return this}trim(e,t){let n=this.times,r=n.length,s=0,a=r-1;for(;s!==r&&n[s]<e;)++s;for(;a!==-1&&n[a]>t;)--a;if(++a,s!==0||a!==r){s>=a&&(a=Math.max(a,1),s=a-1);let o=this.getValueSize();this.times=n.slice(s,a),this.values=this.values.slice(s*o,a*o)}return this}validate(){let e=!0,t=this.getValueSize();t-Math.floor(t)!==0&&(console.error("THREE.KeyframeTrack: Invalid value size in track.",this),e=!1);let n=this.times,r=this.values,s=n.length;s===0&&(console.error("THREE.KeyframeTrack: Track is empty.",this),e=!1);let a=null;for(let o=0;o!==s;o++){let l=n[o];if(typeof l=="number"&&isNaN(l)){console.error("THREE.KeyframeTrack: Time is not a valid number.",this,o,l),e=!1;break}if(a!==null&&a>l){console.error("THREE.KeyframeTrack: Out of order keys.",this,o,l,a),e=!1;break}a=l}if(r!==void 0&&H_(r))for(let o=0,l=r.length;o!==l;++o){let c=r[o];if(isNaN(c)){console.error("THREE.KeyframeTrack: Value is not a valid number.",this,o,c),e=!1;break}}return e}optimize(){let e=this.times.slice(),t=this.values.slice(),n=this.getValueSize(),r=this.getInterpolation()===Oo,s=e.length-1,a=1;for(let o=1;o<s;++o){let l=!1,c=e[o],u=e[o+1];if(c!==u&&(o!==1||c!==e[0]))if(r)l=!0;else{let f=o*n,d=f-n,p=f+n;for(let g=0;g!==n;++g){let _=t[f+g];if(_!==t[d+g]||_!==t[p+g]){l=!0;break}}}if(l){if(o!==a){e[a]=e[o];let f=o*n,d=a*n;for(let p=0;p!==n;++p)t[d+p]=t[f+p]}++a}}if(s>0){e[a]=e[s];for(let o=s*n,l=a*n,c=0;c!==n;++c)t[l+c]=t[o+c];++a}return a!==e.length?(this.times=e.slice(0,a),this.values=t.slice(0,a*n)):(this.times=e,this.values=t),this}clone(){let e=this.times.slice(),t=this.values.slice(),n=this.constructor,r=new n(this.name,e,t);return r.createInterpolant=this.createInterpolant,r}};un.prototype.TimeBufferType=Float32Array;un.prototype.ValueBufferType=Float32Array;un.prototype.DefaultInterpolation=Zl;var bi=class extends un{constructor(e,t,n){super(e,t,n)}};bi.prototype.ValueTypeName="bool";bi.prototype.ValueBufferType=Array;bi.prototype.DefaultInterpolation=Xs;bi.prototype.InterpolantFactoryMethodLinear=void 0;bi.prototype.InterpolantFactoryMethodSmooth=void 0;var mc=class extends un{};mc.prototype.ValueTypeName="color";var gc=class extends un{};gc.prototype.ValueTypeName="number";var xc=class extends pr{constructor(e,t,n,r){super(e,t,n,r)}interpolate_(e,t,n,r){let s=this.resultBuffer,a=this.sampleValues,o=this.valueSize,l=(n-t)/(r-t),c=e*o;for(let u=c+o;c!==u;c+=4)ln.slerpFlat(s,0,a,c-o,a,c,l);return s}},ca=class extends un{InterpolantFactoryMethodLinear(e){return new xc(this.times,this.values,this.getValueSize(),e)}};ca.prototype.ValueTypeName="quaternion";ca.prototype.InterpolantFactoryMethodSmooth=void 0;var wi=class extends un{constructor(e,t,n){super(e,t,n)}};wi.prototype.ValueTypeName="string";wi.prototype.ValueBufferType=Array;wi.prototype.DefaultInterpolation=Xs;wi.prototype.InterpolantFactoryMethodLinear=void 0;wi.prototype.InterpolantFactoryMethodSmooth=void 0;var _c=class extends un{};_c.prototype.ValueTypeName="vector";var yc=class{constructor(e,t,n){let r=this,s=!1,a=0,o=0,l,c=[];this.onStart=void 0,this.onLoad=e,this.onProgress=t,this.onError=n,this.itemStart=function(u){o++,s===!1&&r.onStart!==void 0&&r.onStart(u,a,o),s=!0},this.itemEnd=function(u){a++,r.onProgress!==void 0&&r.onProgress(u,a,o),a===o&&(s=!1,r.onLoad!==void 0&&r.onLoad())},this.itemError=function(u){r.onError!==void 0&&r.onError(u)},this.resolveURL=function(u){return l?l(u):u},this.setURLModifier=function(u){return l=u,this},this.addHandler=function(u,f){return c.push(u,f),this},this.removeHandler=function(u){let f=c.indexOf(u);return f!==-1&&c.splice(f,2),this},this.getHandler=function(u){for(let f=0,d=c.length;f<d;f+=2){let p=c[f],g=c[f+1];if(p.global&&(p.lastIndex=0),p.test(u))return g}return null}}},V_=new yc,vc=class{constructor(e){this.manager=e!==void 0?e:V_,this.crossOrigin="anonymous",this.withCredentials=!1,this.path="",this.resourcePath="",this.requestHeader={}}load(){}loadAsync(e,t){let n=this;return new Promise(function(r,s){n.load(e,r,t,s)})}parse(){}setCrossOrigin(e){return this.crossOrigin=e,this}setWithCredentials(e){return this.withCredentials=e,this}setPath(e){return this.path=e,this}setResourcePath(e){return this.resourcePath=e,this}setRequestHeader(e){return this.requestHeader=e,this}};vc.DEFAULT_MATERIAL_NAME="__DEFAULT";var ua=class extends Ut{constructor(e,t=1){super(),this.isLight=!0,this.type="Light",this.color=new ze(e),this.intensity=t}dispose(){}copy(e,t){return super.copy(e,t),this.color.copy(e.color),this.intensity=e.intensity,this}toJSON(e){let t=super.toJSON(e);return t.object.color=this.color.getHex(),t.object.intensity=this.intensity,this.groundColor!==void 0&&(t.object.groundColor=this.groundColor.getHex()),this.distance!==void 0&&(t.object.distance=this.distance),this.angle!==void 0&&(t.object.angle=this.angle),this.decay!==void 0&&(t.object.decay=this.decay),this.penumbra!==void 0&&(t.object.penumbra=this.penumbra),this.shadow!==void 0&&(t.object.shadow=this.shadow.toJSON()),this.target!==void 0&&(t.object.target=this.target.uuid),t}},fa=class extends ua{constructor(e,t,n){super(e,n),this.isHemisphereLight=!0,this.type="HemisphereLight",this.position.copy(Ut.DEFAULT_UP),this.updateMatrix(),this.groundColor=new ze(t)}copy(e,t){return super.copy(e,t),this.groundColor.copy(e.groundColor),this}},cl=new dt,$f=new O,Zf=new O,Sc=class{constructor(e){this.camera=e,this.intensity=1,this.bias=0,this.normalBias=0,this.radius=1,this.blurSamples=8,this.mapSize=new we(512,512),this.map=null,this.mapPass=null,this.matrix=new dt,this.autoUpdate=!0,this.needsUpdate=!1,this._frustum=new Xr,this._frameExtents=new we(1,1),this._viewportCount=1,this._viewports=[new ht(0,0,1,1)]}getViewportCount(){return this._viewportCount}getFrustum(){return this._frustum}updateMatrices(e){let t=this.camera,n=this.matrix;$f.setFromMatrixPosition(e.matrixWorld),t.position.copy($f),Zf.setFromMatrixPosition(e.target.matrixWorld),t.lookAt(Zf),t.updateMatrixWorld(),cl.multiplyMatrices(t.projectionMatrix,t.matrixWorldInverse),this._frustum.setFromProjectionMatrix(cl),n.set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1),n.multiply(cl)}getViewport(e){return this._viewports[e]}getFrameExtents(){return this._frameExtents}dispose(){this.map&&this.map.dispose(),this.mapPass&&this.mapPass.dispose()}copy(e){return this.camera=e.camera.clone(),this.intensity=e.intensity,this.bias=e.bias,this.radius=e.radius,this.mapSize.copy(e.mapSize),this}clone(){return new this.constructor().copy(this)}toJSON(){let e={};return this.intensity!==1&&(e.intensity=this.intensity),this.bias!==0&&(e.bias=this.bias),this.normalBias!==0&&(e.normalBias=this.normalBias),this.radius!==1&&(e.radius=this.radius),(this.mapSize.x!==512||this.mapSize.y!==512)&&(e.mapSize=this.mapSize.toArray()),e.camera=this.camera.toJSON(!1).object,delete e.camera.matrix,e}};var Mc=class extends Sc{constructor(){super(new ta(-5,5,5,-5,.5,500)),this.isDirectionalLightShadow=!0}},qr=class extends ua{constructor(e,t){super(e,t),this.isDirectionalLight=!0,this.type="DirectionalLight",this.position.copy(Ut.DEFAULT_UP),this.updateMatrix(),this.target=new Ut,this.shadow=new Mc}dispose(){this.shadow.dispose()}copy(e){return super.copy(e),this.target=e.target.clone(),this.shadow=e.shadow.clone(),this}};var ha=class{constructor(e=!0){this.autoStart=e,this.startTime=0,this.oldTime=0,this.elapsedTime=0,this.running=!1}start(){this.startTime=Kf(),this.oldTime=this.startTime,this.elapsedTime=0,this.running=!0}stop(){this.getElapsedTime(),this.running=!1,this.autoStart=!1}getElapsedTime(){return this.getDelta(),this.elapsedTime}getDelta(){let e=0;if(this.autoStart&&!this.running)return this.start(),0;if(this.running){let t=Kf();e=(t-this.oldTime)/1e3,this.oldTime=t,this.elapsedTime+=e}return e}};function Kf(){return performance.now()}var Nc="\\[\\]\\.:\\/",G_=new RegExp("["+Nc+"]","g"),Oc="[^"+Nc+"]",W_="[^"+Nc.replace("\\.","")+"]",X_=/((?:WC+[\/:])*)/.source.replace("WC",Oc),q_=/(WCOD+)?/.source.replace("WCOD",W_),Y_=/(?:\.(WC+)(?:\[(.+)\])?)?/.source.replace("WC",Oc),$_=/\.(WC+)(?:\[(.+)\])?/.source.replace("WC",Oc),Z_=new RegExp("^"+X_+q_+Y_+$_+"$"),K_=["material","materials","bones","map"],bc=class{constructor(e,t,n){let r=n||ct.parseTrackName(t);this._targetGroup=e,this._bindings=e.subscribe_(t,r)}getValue(e,t){this.bind();let n=this._targetGroup.nCachedObjects_,r=this._bindings[n];r!==void 0&&r.getValue(e,t)}setValue(e,t){let n=this._bindings;for(let r=this._targetGroup.nCachedObjects_,s=n.length;r!==s;++r)n[r].setValue(e,t)}bind(){let e=this._bindings;for(let t=this._targetGroup.nCachedObjects_,n=e.length;t!==n;++t)e[t].bind()}unbind(){let e=this._bindings;for(let t=this._targetGroup.nCachedObjects_,n=e.length;t!==n;++t)e[t].unbind()}},ct=class i{constructor(e,t,n){this.path=t,this.parsedPath=n||i.parseTrackName(t),this.node=i.findNode(e,this.parsedPath.nodeName),this.rootNode=e,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}static create(e,t,n){return e&&e.isAnimationObjectGroup?new i.Composite(e,t,n):new i(e,t,n)}static sanitizeNodeName(e){return e.replace(/\s/g,"_").replace(G_,"")}static parseTrackName(e){let t=Z_.exec(e);if(t===null)throw new Error("PropertyBinding: Cannot parse trackName: "+e);let n={nodeName:t[2],objectName:t[3],objectIndex:t[4],propertyName:t[5],propertyIndex:t[6]},r=n.nodeName&&n.nodeName.lastIndexOf(".");if(r!==void 0&&r!==-1){let s=n.nodeName.substring(r+1);K_.indexOf(s)!==-1&&(n.nodeName=n.nodeName.substring(0,r),n.objectName=s)}if(n.propertyName===null||n.propertyName.length===0)throw new Error("PropertyBinding: can not parse propertyName from trackName: "+e);return n}static findNode(e,t){if(t===void 0||t===""||t==="."||t===-1||t===e.name||t===e.uuid)return e;if(e.skeleton){let n=e.skeleton.getBoneByName(t);if(n!==void 0)return n}if(e.children){let n=function(s){for(let a=0;a<s.length;a++){let o=s[a];if(o.name===t||o.uuid===t)return o;let l=n(o.children);if(l)return l}return null},r=n(e.children);if(r)return r}return null}_getValue_unavailable(){}_setValue_unavailable(){}_getValue_direct(e,t){e[t]=this.targetObject[this.propertyName]}_getValue_array(e,t){let n=this.resolvedProperty;for(let r=0,s=n.length;r!==s;++r)e[t++]=n[r]}_getValue_arrayElement(e,t){e[t]=this.resolvedProperty[this.propertyIndex]}_getValue_toArray(e,t){this.resolvedProperty.toArray(e,t)}_setValue_direct(e,t){this.targetObject[this.propertyName]=e[t]}_setValue_direct_setNeedsUpdate(e,t){this.targetObject[this.propertyName]=e[t],this.targetObject.needsUpdate=!0}_setValue_direct_setMatrixWorldNeedsUpdate(e,t){this.targetObject[this.propertyName]=e[t],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_array(e,t){let n=this.resolvedProperty;for(let r=0,s=n.length;r!==s;++r)n[r]=e[t++]}_setValue_array_setNeedsUpdate(e,t){let n=this.resolvedProperty;for(let r=0,s=n.length;r!==s;++r)n[r]=e[t++];this.targetObject.needsUpdate=!0}_setValue_array_setMatrixWorldNeedsUpdate(e,t){let n=this.resolvedProperty;for(let r=0,s=n.length;r!==s;++r)n[r]=e[t++];this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_arrayElement(e,t){this.resolvedProperty[this.propertyIndex]=e[t]}_setValue_arrayElement_setNeedsUpdate(e,t){this.resolvedProperty[this.propertyIndex]=e[t],this.targetObject.needsUpdate=!0}_setValue_arrayElement_setMatrixWorldNeedsUpdate(e,t){this.resolvedProperty[this.propertyIndex]=e[t],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_fromArray(e,t){this.resolvedProperty.fromArray(e,t)}_setValue_fromArray_setNeedsUpdate(e,t){this.resolvedProperty.fromArray(e,t),this.targetObject.needsUpdate=!0}_setValue_fromArray_setMatrixWorldNeedsUpdate(e,t){this.resolvedProperty.fromArray(e,t),this.targetObject.matrixWorldNeedsUpdate=!0}_getValue_unbound(e,t){this.bind(),this.getValue(e,t)}_setValue_unbound(e,t){this.bind(),this.setValue(e,t)}bind(){let e=this.node,t=this.parsedPath,n=t.objectName,r=t.propertyName,s=t.propertyIndex;if(e||(e=i.findNode(this.rootNode,t.nodeName),this.node=e),this.getValue=this._getValue_unavailable,this.setValue=this._setValue_unavailable,!e){console.warn("THREE.PropertyBinding: No target node found for track: "+this.path+".");return}if(n){let c=t.objectIndex;switch(n){case"materials":if(!e.material){console.error("THREE.PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!e.material.materials){console.error("THREE.PropertyBinding: Can not bind to material.materials as node.material does not have a materials array.",this);return}e=e.material.materials;break;case"bones":if(!e.skeleton){console.error("THREE.PropertyBinding: Can not bind to bones as node does not have a skeleton.",this);return}e=e.skeleton.bones;for(let u=0;u<e.length;u++)if(e[u].name===c){c=u;break}break;case"map":if("map"in e){e=e.map;break}if(!e.material){console.error("THREE.PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!e.material.map){console.error("THREE.PropertyBinding: Can not bind to material.map as node.material does not have a map.",this);return}e=e.material.map;break;default:if(e[n]===void 0){console.error("THREE.PropertyBinding: Can not bind to objectName of node undefined.",this);return}e=e[n]}if(c!==void 0){if(e[c]===void 0){console.error("THREE.PropertyBinding: Trying to bind to objectIndex of objectName, but is undefined.",this,e);return}e=e[c]}}let a=e[r];if(a===void 0){let c=t.nodeName;console.error("THREE.PropertyBinding: Trying to update property for track: "+c+"."+r+" but it wasn't found.",e);return}let o=this.Versioning.None;this.targetObject=e,e.needsUpdate!==void 0?o=this.Versioning.NeedsUpdate:e.matrixWorldNeedsUpdate!==void 0&&(o=this.Versioning.MatrixWorldNeedsUpdate);let l=this.BindingType.Direct;if(s!==void 0){if(r==="morphTargetInfluences"){if(!e.geometry){console.error("THREE.PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.",this);return}if(!e.geometry.morphAttributes){console.error("THREE.PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.morphAttributes.",this);return}e.morphTargetDictionary[s]!==void 0&&(s=e.morphTargetDictionary[s])}l=this.BindingType.ArrayElement,this.resolvedProperty=a,this.propertyIndex=s}else a.fromArray!==void 0&&a.toArray!==void 0?(l=this.BindingType.HasFromToArray,this.resolvedProperty=a):Array.isArray(a)?(l=this.BindingType.EntireArray,this.resolvedProperty=a):this.propertyName=r;this.getValue=this.GetterByBindingType[l],this.setValue=this.SetterByBindingTypeAndVersioning[l][o]}unbind(){this.node=null,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}};ct.Composite=bc;ct.prototype.BindingType={Direct:0,EntireArray:1,ArrayElement:2,HasFromToArray:3};ct.prototype.Versioning={None:0,NeedsUpdate:1,MatrixWorldNeedsUpdate:2};ct.prototype.GetterByBindingType=[ct.prototype._getValue_direct,ct.prototype._getValue_array,ct.prototype._getValue_arrayElement,ct.prototype._getValue_toArray];ct.prototype.SetterByBindingTypeAndVersioning=[[ct.prototype._setValue_direct,ct.prototype._setValue_direct_setNeedsUpdate,ct.prototype._setValue_direct_setMatrixWorldNeedsUpdate],[ct.prototype._setValue_array,ct.prototype._setValue_array_setNeedsUpdate,ct.prototype._setValue_array_setMatrixWorldNeedsUpdate],[ct.prototype._setValue_arrayElement,ct.prototype._setValue_arrayElement_setNeedsUpdate,ct.prototype._setValue_arrayElement_setMatrixWorldNeedsUpdate],[ct.prototype._setValue_fromArray,ct.prototype._setValue_fromArray_setNeedsUpdate,ct.prototype._setValue_fromArray_setMatrixWorldNeedsUpdate]];var Zb=new Float32Array(1);var Jf=new dt,da=class{constructor(e,t,n=0,r=1/0){this.ray=new ur(e,t),this.near=n,this.far=r,this.camera=null,this.layers=new Wr,this.params={Mesh:{},Line:{threshold:1},LOD:{},Points:{threshold:1},Sprite:{}}}set(e,t){this.ray.set(e,t)}setFromCamera(e,t){t.isPerspectiveCamera?(this.ray.origin.setFromMatrixPosition(t.matrixWorld),this.ray.direction.set(e.x,e.y,.5).unproject(t).sub(this.ray.origin).normalize(),this.camera=t):t.isOrthographicCamera?(this.ray.origin.set(e.x,e.y,(t.near+t.far)/(t.near-t.far)).unproject(t),this.ray.direction.set(0,0,-1).transformDirection(t.matrixWorld),this.camera=t):console.error("THREE.Raycaster: Unsupported camera type: "+t.type)}setFromXRController(e){return Jf.identity().extractRotation(e.matrixWorld),this.ray.origin.setFromMatrixPosition(e.matrixWorld),this.ray.direction.set(0,0,-1).applyMatrix4(Jf),this}intersectObject(e,t=!0,n=[]){return wc(e,this,n,t),n.sort(jf),n}intersectObjects(e,t=!0,n=[]){for(let r=0,s=e.length;r<s;r++)wc(e[r],this,n,t);return n.sort(jf),n}};function jf(i,e){return i.distance-e.distance}function wc(i,e,t,n){let r=!0;if(i.layers.test(e.layers)&&i.raycast(e,t)===!1&&(r=!1),r===!0&&n===!0){let s=i.children;for(let a=0,o=s.length;a<o;a++)wc(s[a],e,t,!0)}}var Yr=class{constructor(e=1,t=0,n=0){return this.radius=e,this.phi=t,this.theta=n,this}set(e,t,n){return this.radius=e,this.phi=t,this.theta=n,this}copy(e){return this.radius=e.radius,this.phi=e.phi,this.theta=e.theta,this}makeSafe(){return this.phi=Math.max(1e-6,Math.min(Math.PI-1e-6,this.phi)),this}setFromVector3(e){return this.setFromCartesianCoords(e.x,e.y,e.z)}setFromCartesianCoords(e,t,n){return this.radius=Math.sqrt(e*e+t*t+n*n),this.radius===0?(this.theta=0,this.phi=0):(this.theta=Math.atan2(e,n),this.phi=Math.acos(Tt(t/this.radius,-1,1))),this}clone(){return new this.constructor().copy(this)}};var pa=class extends On{constructor(e,t=null){super(),this.object=e,this.domElement=t,this.enabled=!0,this.state=-1,this.keys={},this.mouseButtons={LEFT:null,MIDDLE:null,RIGHT:null},this.touches={ONE:null,TWO:null}}connect(){}disconnect(){}dispose(){}update(){}};typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:"170"}}));typeof window<"u"&&(window.__THREE__?console.warn("WARNING: Multiple instances of Three.js being imported."):window.__THREE__="170");var bh={type:"change"},Bc={type:"start"},Eh={type:"end"},_a=new ur,wh=new sn,j_=Math.cos(70*ph.DEG2RAD),St=new O,Ft=2*Math.PI,et={NONE:-1,ROTATE:0,DOLLY:1,PAN:2,TOUCH_ROTATE:3,TOUCH_PAN:4,TOUCH_DOLLY_PAN:5,TOUCH_DOLLY_ROTATE:6},Fc=1e-6,ya=class extends pa{constructor(e,t=null){super(e,t),this.state=et.NONE,this.enabled=!0,this.target=new O,this.cursor=new O,this.minDistance=0,this.maxDistance=1/0,this.minZoom=0,this.maxZoom=1/0,this.minTargetRadius=0,this.maxTargetRadius=1/0,this.minPolarAngle=0,this.maxPolarAngle=Math.PI,this.minAzimuthAngle=-1/0,this.maxAzimuthAngle=1/0,this.enableDamping=!1,this.dampingFactor=.05,this.enableZoom=!0,this.zoomSpeed=1,this.enableRotate=!0,this.rotateSpeed=1,this.enablePan=!0,this.panSpeed=1,this.screenSpacePanning=!0,this.keyPanSpeed=7,this.zoomToCursor=!1,this.autoRotate=!1,this.autoRotateSpeed=2,this.keys={LEFT:"ArrowLeft",UP:"ArrowUp",RIGHT:"ArrowRight",BOTTOM:"ArrowDown"},this.mouseButtons={LEFT:Ei.ROTATE,MIDDLE:Ei.DOLLY,RIGHT:Ei.PAN},this.touches={ONE:Ti.ROTATE,TWO:Ti.DOLLY_PAN},this.target0=this.target.clone(),this.position0=this.object.position.clone(),this.zoom0=this.object.zoom,this._domElementKeyEvents=null,this._lastPosition=new O,this._lastQuaternion=new ln,this._lastTargetPosition=new O,this._quat=new ln().setFromUnitVectors(e.up,new O(0,1,0)),this._quatInverse=this._quat.clone().invert(),this._spherical=new Yr,this._sphericalDelta=new Yr,this._scale=1,this._panOffset=new O,this._rotateStart=new we,this._rotateEnd=new we,this._rotateDelta=new we,this._panStart=new we,this._panEnd=new we,this._panDelta=new we,this._dollyStart=new we,this._dollyEnd=new we,this._dollyDelta=new we,this._dollyDirection=new O,this._mouse=new we,this._performCursorZoom=!1,this._pointers=[],this._pointerPositions={},this._controlActive=!1,this._onPointerMove=ey.bind(this),this._onPointerDown=Q_.bind(this),this._onPointerUp=ty.bind(this),this._onContextMenu=ly.bind(this),this._onMouseWheel=ry.bind(this),this._onKeyDown=sy.bind(this),this._onTouchStart=ay.bind(this),this._onTouchMove=oy.bind(this),this._onMouseDown=ny.bind(this),this._onMouseMove=iy.bind(this),this._interceptControlDown=cy.bind(this),this._interceptControlUp=uy.bind(this),this.domElement!==null&&this.connect(),this.update()}connect(){this.domElement.addEventListener("pointerdown",this._onPointerDown),this.domElement.addEventListener("pointercancel",this._onPointerUp),this.domElement.addEventListener("contextmenu",this._onContextMenu),this.domElement.addEventListener("wheel",this._onMouseWheel,{passive:!1}),this.domElement.getRootNode().addEventListener("keydown",this._interceptControlDown,{passive:!0,capture:!0}),this.domElement.style.touchAction="none"}disconnect(){this.domElement.removeEventListener("pointerdown",this._onPointerDown),this.domElement.removeEventListener("pointermove",this._onPointerMove),this.domElement.removeEventListener("pointerup",this._onPointerUp),this.domElement.removeEventListener("pointercancel",this._onPointerUp),this.domElement.removeEventListener("wheel",this._onMouseWheel),this.domElement.removeEventListener("contextmenu",this._onContextMenu),this.stopListenToKeyEvents(),this.domElement.getRootNode().removeEventListener("keydown",this._interceptControlDown,{capture:!0}),this.domElement.style.touchAction="auto"}dispose(){this.disconnect()}getPolarAngle(){return this._spherical.phi}getAzimuthalAngle(){return this._spherical.theta}getDistance(){return this.object.position.distanceTo(this.target)}listenToKeyEvents(e){e.addEventListener("keydown",this._onKeyDown),this._domElementKeyEvents=e}stopListenToKeyEvents(){this._domElementKeyEvents!==null&&(this._domElementKeyEvents.removeEventListener("keydown",this._onKeyDown),this._domElementKeyEvents=null)}saveState(){this.target0.copy(this.target),this.position0.copy(this.object.position),this.zoom0=this.object.zoom}reset(){this.target.copy(this.target0),this.object.position.copy(this.position0),this.object.zoom=this.zoom0,this.object.updateProjectionMatrix(),this.dispatchEvent(bh),this.update(),this.state=et.NONE}update(e=null){let t=this.object.position;St.copy(t).sub(this.target),St.applyQuaternion(this._quat),this._spherical.setFromVector3(St),this.autoRotate&&this.state===et.NONE&&this._rotateLeft(this._getAutoRotationAngle(e)),this.enableDamping?(this._spherical.theta+=this._sphericalDelta.theta*this.dampingFactor,this._spherical.phi+=this._sphericalDelta.phi*this.dampingFactor):(this._spherical.theta+=this._sphericalDelta.theta,this._spherical.phi+=this._sphericalDelta.phi);let n=this.minAzimuthAngle,r=this.maxAzimuthAngle;isFinite(n)&&isFinite(r)&&(n<-Math.PI?n+=Ft:n>Math.PI&&(n-=Ft),r<-Math.PI?r+=Ft:r>Math.PI&&(r-=Ft),n<=r?this._spherical.theta=Math.max(n,Math.min(r,this._spherical.theta)):this._spherical.theta=this._spherical.theta>(n+r)/2?Math.max(n,this._spherical.theta):Math.min(r,this._spherical.theta)),this._spherical.phi=Math.max(this.minPolarAngle,Math.min(this.maxPolarAngle,this._spherical.phi)),this._spherical.makeSafe(),this.enableDamping===!0?this.target.addScaledVector(this._panOffset,this.dampingFactor):this.target.add(this._panOffset),this.target.sub(this.cursor),this.target.clampLength(this.minTargetRadius,this.maxTargetRadius),this.target.add(this.cursor);let s=!1;if(this.zoomToCursor&&this._performCursorZoom||this.object.isOrthographicCamera)this._spherical.radius=this._clampDistance(this._spherical.radius);else{let a=this._spherical.radius;this._spherical.radius=this._clampDistance(this._spherical.radius*this._scale),s=a!=this._spherical.radius}if(St.setFromSpherical(this._spherical),St.applyQuaternion(this._quatInverse),t.copy(this.target).add(St),this.object.lookAt(this.target),this.enableDamping===!0?(this._sphericalDelta.theta*=1-this.dampingFactor,this._sphericalDelta.phi*=1-this.dampingFactor,this._panOffset.multiplyScalar(1-this.dampingFactor)):(this._sphericalDelta.set(0,0,0),this._panOffset.set(0,0,0)),this.zoomToCursor&&this._performCursorZoom){let a=null;if(this.object.isPerspectiveCamera){let o=St.length();a=this._clampDistance(o*this._scale);let l=o-a;this.object.position.addScaledVector(this._dollyDirection,l),this.object.updateMatrixWorld(),s=!!l}else if(this.object.isOrthographicCamera){let o=new O(this._mouse.x,this._mouse.y,0);o.unproject(this.object);let l=this.object.zoom;this.object.zoom=Math.max(this.minZoom,Math.min(this.maxZoom,this.object.zoom/this._scale)),this.object.updateProjectionMatrix(),s=l!==this.object.zoom;let c=new O(this._mouse.x,this._mouse.y,0);c.unproject(this.object),this.object.position.sub(c).add(o),this.object.updateMatrixWorld(),a=St.length()}else console.warn("WARNING: OrbitControls.js encountered an unknown camera type - zoom to cursor disabled."),this.zoomToCursor=!1;a!==null&&(this.screenSpacePanning?this.target.set(0,0,-1).transformDirection(this.object.matrix).multiplyScalar(a).add(this.object.position):(_a.origin.copy(this.object.position),_a.direction.set(0,0,-1).transformDirection(this.object.matrix),Math.abs(this.object.up.dot(_a.direction))<j_?this.object.lookAt(this.target):(wh.setFromNormalAndCoplanarPoint(this.object.up,this.target),_a.intersectPlane(wh,this.target))))}else if(this.object.isOrthographicCamera){let a=this.object.zoom;this.object.zoom=Math.max(this.minZoom,Math.min(this.maxZoom,this.object.zoom/this._scale)),a!==this.object.zoom&&(this.object.updateProjectionMatrix(),s=!0)}return this._scale=1,this._performCursorZoom=!1,s||this._lastPosition.distanceToSquared(this.object.position)>Fc||8*(1-this._lastQuaternion.dot(this.object.quaternion))>Fc||this._lastTargetPosition.distanceToSquared(this.target)>Fc?(this.dispatchEvent(bh),this._lastPosition.copy(this.object.position),this._lastQuaternion.copy(this.object.quaternion),this._lastTargetPosition.copy(this.target),!0):!1}_getAutoRotationAngle(e){return e!==null?Ft/60*this.autoRotateSpeed*e:Ft/60/60*this.autoRotateSpeed}_getZoomScale(e){let t=Math.abs(e*.01);return Math.pow(.95,this.zoomSpeed*t)}_rotateLeft(e){this._sphericalDelta.theta-=e}_rotateUp(e){this._sphericalDelta.phi-=e}_panLeft(e,t){St.setFromMatrixColumn(t,0),St.multiplyScalar(-e),this._panOffset.add(St)}_panUp(e,t){this.screenSpacePanning===!0?St.setFromMatrixColumn(t,1):(St.setFromMatrixColumn(t,0),St.crossVectors(this.object.up,St)),St.multiplyScalar(e),this._panOffset.add(St)}_pan(e,t){let n=this.domElement;if(this.object.isPerspectiveCamera){let r=this.object.position;St.copy(r).sub(this.target);let s=St.length();s*=Math.tan(this.object.fov/2*Math.PI/180),this._panLeft(2*e*s/n.clientHeight,this.object.matrix),this._panUp(2*t*s/n.clientHeight,this.object.matrix)}else this.object.isOrthographicCamera?(this._panLeft(e*(this.object.right-this.object.left)/this.object.zoom/n.clientWidth,this.object.matrix),this._panUp(t*(this.object.top-this.object.bottom)/this.object.zoom/n.clientHeight,this.object.matrix)):(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - pan disabled."),this.enablePan=!1)}_dollyOut(e){this.object.isPerspectiveCamera||this.object.isOrthographicCamera?this._scale/=e:(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled."),this.enableZoom=!1)}_dollyIn(e){this.object.isPerspectiveCamera||this.object.isOrthographicCamera?this._scale*=e:(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled."),this.enableZoom=!1)}_updateZoomParameters(e,t){if(!this.zoomToCursor)return;this._performCursorZoom=!0;let n=this.domElement.getBoundingClientRect(),r=e-n.left,s=t-n.top,a=n.width,o=n.height;this._mouse.x=r/a*2-1,this._mouse.y=-(s/o)*2+1,this._dollyDirection.set(this._mouse.x,this._mouse.y,1).unproject(this.object).sub(this.object.position).normalize()}_clampDistance(e){return Math.max(this.minDistance,Math.min(this.maxDistance,e))}_handleMouseDownRotate(e){this._rotateStart.set(e.clientX,e.clientY)}_handleMouseDownDolly(e){this._updateZoomParameters(e.clientX,e.clientX),this._dollyStart.set(e.clientX,e.clientY)}_handleMouseDownPan(e){this._panStart.set(e.clientX,e.clientY)}_handleMouseMoveRotate(e){this._rotateEnd.set(e.clientX,e.clientY),this._rotateDelta.subVectors(this._rotateEnd,this._rotateStart).multiplyScalar(this.rotateSpeed);let t=this.domElement;this._rotateLeft(Ft*this._rotateDelta.x/t.clientHeight),this._rotateUp(Ft*this._rotateDelta.y/t.clientHeight),this._rotateStart.copy(this._rotateEnd),this.update()}_handleMouseMoveDolly(e){this._dollyEnd.set(e.clientX,e.clientY),this._dollyDelta.subVectors(this._dollyEnd,this._dollyStart),this._dollyDelta.y>0?this._dollyOut(this._getZoomScale(this._dollyDelta.y)):this._dollyDelta.y<0&&this._dollyIn(this._getZoomScale(this._dollyDelta.y)),this._dollyStart.copy(this._dollyEnd),this.update()}_handleMouseMovePan(e){this._panEnd.set(e.clientX,e.clientY),this._panDelta.subVectors(this._panEnd,this._panStart).multiplyScalar(this.panSpeed),this._pan(this._panDelta.x,this._panDelta.y),this._panStart.copy(this._panEnd),this.update()}_handleMouseWheel(e){this._updateZoomParameters(e.clientX,e.clientY),e.deltaY<0?this._dollyIn(this._getZoomScale(e.deltaY)):e.deltaY>0&&this._dollyOut(this._getZoomScale(e.deltaY)),this.update()}_handleKeyDown(e){let t=!1;switch(e.code){case this.keys.UP:e.ctrlKey||e.metaKey||e.shiftKey?this._rotateUp(Ft*this.rotateSpeed/this.domElement.clientHeight):this._pan(0,this.keyPanSpeed),t=!0;break;case this.keys.BOTTOM:e.ctrlKey||e.metaKey||e.shiftKey?this._rotateUp(-Ft*this.rotateSpeed/this.domElement.clientHeight):this._pan(0,-this.keyPanSpeed),t=!0;break;case this.keys.LEFT:e.ctrlKey||e.metaKey||e.shiftKey?this._rotateLeft(Ft*this.rotateSpeed/this.domElement.clientHeight):this._pan(this.keyPanSpeed,0),t=!0;break;case this.keys.RIGHT:e.ctrlKey||e.metaKey||e.shiftKey?this._rotateLeft(-Ft*this.rotateSpeed/this.domElement.clientHeight):this._pan(-this.keyPanSpeed,0),t=!0;break}t&&(e.preventDefault(),this.update())}_handleTouchStartRotate(e){if(this._pointers.length===1)this._rotateStart.set(e.pageX,e.pageY);else{let t=this._getSecondPointerPosition(e),n=.5*(e.pageX+t.x),r=.5*(e.pageY+t.y);this._rotateStart.set(n,r)}}_handleTouchStartPan(e){if(this._pointers.length===1)this._panStart.set(e.pageX,e.pageY);else{let t=this._getSecondPointerPosition(e),n=.5*(e.pageX+t.x),r=.5*(e.pageY+t.y);this._panStart.set(n,r)}}_handleTouchStartDolly(e){let t=this._getSecondPointerPosition(e),n=e.pageX-t.x,r=e.pageY-t.y,s=Math.sqrt(n*n+r*r);this._dollyStart.set(0,s)}_handleTouchStartDollyPan(e){this.enableZoom&&this._handleTouchStartDolly(e),this.enablePan&&this._handleTouchStartPan(e)}_handleTouchStartDollyRotate(e){this.enableZoom&&this._handleTouchStartDolly(e),this.enableRotate&&this._handleTouchStartRotate(e)}_handleTouchMoveRotate(e){if(this._pointers.length==1)this._rotateEnd.set(e.pageX,e.pageY);else{let n=this._getSecondPointerPosition(e),r=.5*(e.pageX+n.x),s=.5*(e.pageY+n.y);this._rotateEnd.set(r,s)}this._rotateDelta.subVectors(this._rotateEnd,this._rotateStart).multiplyScalar(this.rotateSpeed);let t=this.domElement;this._rotateLeft(Ft*this._rotateDelta.x/t.clientHeight),this._rotateUp(Ft*this._rotateDelta.y/t.clientHeight),this._rotateStart.copy(this._rotateEnd)}_handleTouchMovePan(e){if(this._pointers.length===1)this._panEnd.set(e.pageX,e.pageY);else{let t=this._getSecondPointerPosition(e),n=.5*(e.pageX+t.x),r=.5*(e.pageY+t.y);this._panEnd.set(n,r)}this._panDelta.subVectors(this._panEnd,this._panStart).multiplyScalar(this.panSpeed),this._pan(this._panDelta.x,this._panDelta.y),this._panStart.copy(this._panEnd)}_handleTouchMoveDolly(e){let t=this._getSecondPointerPosition(e),n=e.pageX-t.x,r=e.pageY-t.y,s=Math.sqrt(n*n+r*r);this._dollyEnd.set(0,s),this._dollyDelta.set(0,Math.pow(this._dollyEnd.y/this._dollyStart.y,this.zoomSpeed)),this._dollyOut(this._dollyDelta.y),this._dollyStart.copy(this._dollyEnd);let a=(e.pageX+t.x)*.5,o=(e.pageY+t.y)*.5;this._updateZoomParameters(a,o)}_handleTouchMoveDollyPan(e){this.enableZoom&&this._handleTouchMoveDolly(e),this.enablePan&&this._handleTouchMovePan(e)}_handleTouchMoveDollyRotate(e){this.enableZoom&&this._handleTouchMoveDolly(e),this.enableRotate&&this._handleTouchMoveRotate(e)}_addPointer(e){this._pointers.push(e.pointerId)}_removePointer(e){delete this._pointerPositions[e.pointerId];for(let t=0;t<this._pointers.length;t++)if(this._pointers[t]==e.pointerId){this._pointers.splice(t,1);return}}_isTrackingPointer(e){for(let t=0;t<this._pointers.length;t++)if(this._pointers[t]==e.pointerId)return!0;return!1}_trackPointer(e){let t=this._pointerPositions[e.pointerId];t===void 0&&(t=new we,this._pointerPositions[e.pointerId]=t),t.set(e.pageX,e.pageY)}_getSecondPointerPosition(e){let t=e.pointerId===this._pointers[0]?this._pointers[1]:this._pointers[0];return this._pointerPositions[t]}_customWheelEvent(e){let t=e.deltaMode,n={clientX:e.clientX,clientY:e.clientY,deltaY:e.deltaY};switch(t){case 1:n.deltaY*=16;break;case 2:n.deltaY*=100;break}return e.ctrlKey&&!this._controlActive&&(n.deltaY*=10),n}};function Q_(i){this.enabled!==!1&&(this._pointers.length===0&&(this.domElement.setPointerCapture(i.pointerId),this.domElement.addEventListener("pointermove",this._onPointerMove),this.domElement.addEventListener("pointerup",this._onPointerUp)),!this._isTrackingPointer(i)&&(this._addPointer(i),i.pointerType==="touch"?this._onTouchStart(i):this._onMouseDown(i)))}function ey(i){this.enabled!==!1&&(i.pointerType==="touch"?this._onTouchMove(i):this._onMouseMove(i))}function ty(i){switch(this._removePointer(i),this._pointers.length){case 0:this.domElement.releasePointerCapture(i.pointerId),this.domElement.removeEventListener("pointermove",this._onPointerMove),this.domElement.removeEventListener("pointerup",this._onPointerUp),this.dispatchEvent(Eh),this.state=et.NONE;break;case 1:let e=this._pointers[0],t=this._pointerPositions[e];this._onTouchStart({pointerId:e,pageX:t.x,pageY:t.y});break}}function ny(i){let e;switch(i.button){case 0:e=this.mouseButtons.LEFT;break;case 1:e=this.mouseButtons.MIDDLE;break;case 2:e=this.mouseButtons.RIGHT;break;default:e=-1}switch(e){case Ei.DOLLY:if(this.enableZoom===!1)return;this._handleMouseDownDolly(i),this.state=et.DOLLY;break;case Ei.ROTATE:if(i.ctrlKey||i.metaKey||i.shiftKey){if(this.enablePan===!1)return;this._handleMouseDownPan(i),this.state=et.PAN}else{if(this.enableRotate===!1)return;this._handleMouseDownRotate(i),this.state=et.ROTATE}break;case Ei.PAN:if(i.ctrlKey||i.metaKey||i.shiftKey){if(this.enableRotate===!1)return;this._handleMouseDownRotate(i),this.state=et.ROTATE}else{if(this.enablePan===!1)return;this._handleMouseDownPan(i),this.state=et.PAN}break;default:this.state=et.NONE}this.state!==et.NONE&&this.dispatchEvent(Bc)}function iy(i){switch(this.state){case et.ROTATE:if(this.enableRotate===!1)return;this._handleMouseMoveRotate(i);break;case et.DOLLY:if(this.enableZoom===!1)return;this._handleMouseMoveDolly(i);break;case et.PAN:if(this.enablePan===!1)return;this._handleMouseMovePan(i);break}}function ry(i){this.enabled===!1||this.enableZoom===!1||this.state!==et.NONE||(i.preventDefault(),this.dispatchEvent(Bc),this._handleMouseWheel(this._customWheelEvent(i)),this.dispatchEvent(Eh))}function sy(i){this.enabled===!1||this.enablePan===!1||this._handleKeyDown(i)}function ay(i){switch(this._trackPointer(i),this._pointers.length){case 1:switch(this.touches.ONE){case Ti.ROTATE:if(this.enableRotate===!1)return;this._handleTouchStartRotate(i),this.state=et.TOUCH_ROTATE;break;case Ti.PAN:if(this.enablePan===!1)return;this._handleTouchStartPan(i),this.state=et.TOUCH_PAN;break;default:this.state=et.NONE}break;case 2:switch(this.touches.TWO){case Ti.DOLLY_PAN:if(this.enableZoom===!1&&this.enablePan===!1)return;this._handleTouchStartDollyPan(i),this.state=et.TOUCH_DOLLY_PAN;break;case Ti.DOLLY_ROTATE:if(this.enableZoom===!1&&this.enableRotate===!1)return;this._handleTouchStartDollyRotate(i),this.state=et.TOUCH_DOLLY_ROTATE;break;default:this.state=et.NONE}break;default:this.state=et.NONE}this.state!==et.NONE&&this.dispatchEvent(Bc)}function oy(i){switch(this._trackPointer(i),this.state){case et.TOUCH_ROTATE:if(this.enableRotate===!1)return;this._handleTouchMoveRotate(i),this.update();break;case et.TOUCH_PAN:if(this.enablePan===!1)return;this._handleTouchMovePan(i),this.update();break;case et.TOUCH_DOLLY_PAN:if(this.enableZoom===!1&&this.enablePan===!1)return;this._handleTouchMoveDollyPan(i),this.update();break;case et.TOUCH_DOLLY_ROTATE:if(this.enableZoom===!1&&this.enableRotate===!1)return;this._handleTouchMoveDollyRotate(i),this.update();break;default:this.state=et.NONE}}function ly(i){this.enabled!==!1&&i.preventDefault()}function cy(i){i.key==="Control"&&(this._controlActive=!0,this.domElement.getRootNode().addEventListener("keyup",this._interceptControlUp,{passive:!0,capture:!0}))}function uy(i){i.key==="Control"&&(this._controlActive=!1,this.domElement.getRootNode().removeEventListener("keyup",this._interceptControlUp,{passive:!0,capture:!0}))}var kc="#f4ecd8",zc="#15211b",Ai="#c9972b",ti="#e2b33c";var Hc=1,fy=.06,_n=.14;function hy(i){return i<=6?{row:7,col:7-i}:i<=12?{row:7-(i-6),col:1}:i<=18?{row:1,col:1+(i-12)}:{row:1+(i-18),col:7}}var Zr=i=>{let e=hy(i);return new O((e.col-4)*Hc,0,(e.row-4)*Hc)};var dy={station:"GO",vault:"JACKPOT",desk:"OPEN",workshop:"OPEN",plaza:"OPEN"},py={station:"START",vault:"WIN THE POOL",desk:"LAUNCH A COIN",workshop:"LAUNCH A COIN",plaza:"LAUNCH A COIN"};async function Ah(){try{await Promise.all(["600 30px Fraunces","800 60px Fraunces","500 20px PlexMono"].map(i=>document.fonts.load(i)))}catch{}}function Ch(){try{let i=document.createElement("canvas");return!!(window.WebGLRenderingContext&&(i.getContext("webgl2")||i.getContext("webgl")))}catch{return!1}}function my(i,e,t){let n=e.split(" "),r=[],s="";for(let a of n){let o=s?`${s} ${a}`:a;i.measureText(o).width>t&&s?(r.push(s),s=a):s=o}return s&&r.push(s),r}function gy(i,e,t,n,r){let a=document.createElement("canvas");a.width=a.height=256;let o=a.getContext("2d");o.fillStyle="#14281e",o.fillRect(0,0,256,256),o.fillStyle=t?t.color:Ai,o.fillRect(0,0,256,14),o.strokeStyle=Ai,o.lineWidth=5,o.strokeRect(6,18,244,232);let l=256/2,c=98,u=56;if(o.save(),o.beginPath(),o.arc(l,c,u,0,Math.PI*2),o.closePath(),o.clip(),r&&r.complete&&r.naturalWidth){let d=Math.max(2*u/r.naturalWidth,2*u/r.naturalHeight),p=r.naturalWidth*d,g=r.naturalHeight*d;o.drawImage(r,l-p/2,c-g/2,p,g)}else o.fillStyle="#2a4a3a",o.fillRect(l-u,c-u,2*u,2*u),o.fillStyle=ti,o.font="800 44px Fraunces, Georgia, serif",o.textAlign="center",o.textBaseline="middle",o.fillText(n.symbol.slice(0,2),l,c+2);o.restore(),o.strokeStyle=ti,o.lineWidth=5,o.beginPath(),o.arc(l,c,u,0,Math.PI*2),o.stroke(),o.textAlign="center",o.textBaseline="middle",o.fillStyle=ti,o.font="800 34px Fraunces, Georgia, serif",o.fillText(`$${n.symbol}`.slice(0,11),l,184),o.fillStyle="rgba(244,236,216,.75)",o.font="500 18px PlexMono, monospace",o.fillText(`${(n.grownLamports/1e9).toFixed(2)} SOL GROWN`,l,222);let f=new Si(a);return f.colorSpace=bt,f.anisotropy=4,f}function xy(i,e,t){let r=document.createElement("canvas");r.width=r.height=256;let s=r.getContext("2d"),a=!e;s.fillStyle=a?i.type==="station"?Ai:i.type==="vault"?"#3a3418":"#1d4634":kc,s.fillRect(0,0,256,256);let o=a&&i.type!=="station"?kc:zc;if(e){s.fillStyle=t.color,s.fillRect(0,0,256,58);for(let f=0;f<5;f++)s.fillStyle=f<e.level?"#fff":"rgba(255,255,255,.3)",s.fillRect(38+f*38,22,30,12)}else s.strokeStyle=i.type==="station"?"rgba(21,33,27,.35)":"rgba(226,179,60,.55)",s.lineWidth=6,s.strokeRect(10,10,236,236);s.fillStyle=o,s.textAlign="center",s.textBaseline="middle",s.font=`600 ${a?30:34}px Fraunces, Georgia, serif`;let l=my(s,i.name,220).slice(0,2),c=e?112:90;l.forEach((f,d)=>s.fillText(f,256/2,c+d*38)),s.font="500 20px PlexMono, monospace",s.fillStyle=a?i.type==="station"?"rgba(21,33,27,.75)":"rgba(244,236,216,.75)":"#6a776e",e?(s.fillText("LAUNCH A COIN",256/2,200),s.fillStyle="rgba(21,33,27,.12)",s.fillRect(48,222,160,8),s.fillStyle=t.color,s.fillRect(48,222,160*(e.next?Math.min(1,e.xp/e.next):1),8)):(s.font=`800 ${i.type==="station"?54:26}px ${i.type==="station"?"Fraunces, Georgia, serif":"PlexMono, monospace"}`,s.fillStyle=i.type==="station"?zc:ti,s.fillText(dy[i.type]||"",256/2,168),s.font="500 18px PlexMono, monospace",s.fillStyle=i.type==="station"?"rgba(21,33,27,.75)":"rgba(244,236,216,.7)",s.fillText(py[i.type]||"",256/2,214));let u=new Si(r);return u.colorSpace=bt,u.anisotropy=4,u}function _y(){let e=document.createElement("canvas");e.width=e.height=1024;let t=e.getContext("2d"),n=t.createRadialGradient(1024/2,1024/2,40,1024/2,1024/2,1024*.7);n.addColorStop(0,"#1c4a35"),n.addColorStop(1,"#0d2519"),t.fillStyle=n,t.fillRect(0,0,1024,1024),t.strokeStyle="rgba(201,151,43,.45)",t.lineWidth=6,t.strokeRect(24,24,976,976),t.strokeStyle="rgba(201,151,43,.18)",t.lineWidth=2;for(let s=1;s<8;s++)t.beginPath(),t.moveTo(1024/8*s,30),t.lineTo(1024/8*s,994),t.stroke(),t.beginPath(),t.moveTo(30,1024/8*s),t.lineTo(994,1024/8*s),t.stroke();t.textAlign="center",t.textBaseline="middle",t.fillStyle=kc,t.font="800 128px Fraunces, Georgia, serif",t.fillText("TEK CITY",1024/2,170),t.fillStyle=Ai,t.font="500 30px PlexMono, monospace",t.fillText("BUILD THE CITY \xB7 OWN THE CULTURE",1024/2,260);let r=new Si(e);return r.colorSpace=bt,r.anisotropy=8,r}function yy(i){let t=document.createElement("canvas");t.width=t.height=128;let n=t.getContext("2d");n.fillStyle="#fbf6ea",n.fillRect(0,0,128,128);let r={1:[[2,2]],2:[[1,1],[3,3]],3:[[1,1],[2,2],[3,3]],4:[[1,1],[3,1],[1,3],[3,3]],5:[[1,1],[3,1],[2,2],[1,3],[3,3]],6:[[1,1],[3,1],[1,2],[3,2],[1,3],[3,3]]}[i];n.fillStyle=i===1?"#b6463a":zc;for(let[a,o]of r)n.beginPath(),n.arc(a*128/4,o*128/4,11,0,Math.PI*2),n.fill();let s=new Si(t);return s.colorSpace=bt,s}var vy=[3,4,1,6,2,5],Sy={1:[0,0],6:[Math.PI,0],2:[-Math.PI/2,0],5:[Math.PI/2,0],3:[0,Math.PI/2],4:[0,-Math.PI/2]};function Th(i,e=1,t=!1){let n=new gn,r=new vt({color:i,roughness:.35,metalness:.15}),s=[[0,0],[.16,0],[.16,.04],[.1,.08],[.07,.2],[.05,.28],[.09,.3],[0,.31]].map(([l,c])=>new we(l,c)),a=new Qe(new aa(s,24),r);a.castShadow=!0;let o=new Qe(new la(.085,20,16),r);if(o.position.y=.37,o.castShadow=!0,n.add(a,o),t){let l=new Qe(new dr(.22,.025,8,32),new vt({color:ti,emissive:ti,emissiveIntensity:.8}));l.rotation.x=Math.PI/2,l.position.y=.02,n.add(l),n.userData.ring=l}return n.scale.setScalar(e),n}var va=class{constructor(e,{onSelect:t}){this.container=e,this.onSelect=t,this.tiles=new Map,this.buildings=new Map,this.coinMeshes=new Map,this.imgs=new Map,this.others=[],this.me=null,this.myColor=null,this.myPos=null,this.sig=new Map;let n=e.clientWidth||600,r=e.clientHeight||600,s=this.renderer=new ra({antialias:!0,alpha:!0,powerPreference:"high-performance"});s.setPixelRatio(Math.min(2,window.devicePixelRatio||1)),s.setSize(n,r),s.outputColorSpace=bt,s.toneMapping=Tc,s.toneMappingExposure=1.05,s.shadowMap.enabled=!0,s.shadowMap.type=Ec,e.append(s.domElement),s.domElement.setAttribute("aria-label","TEK CITY 3D board"),s.domElement.setAttribute("role","img");let a=this.scene=new sa,o=this.camera=new Dt(36,n/r,.1,100);this.mobile=window.matchMedia("(max-width: 900px)").matches,this.fit(),a.add(new fa(16774364,729880,1.1));let l=new qr(16771e3,2.2);l.position.set(-5,10,6),l.castShadow=!0,l.shadow.mapSize.set(1024,1024),Object.assign(l.shadow.camera,{left:-6,right:6,top:6,bottom:-6,near:1,far:30}),l.shadow.bias=-8e-4,a.add(l);let c=new qr(9418461,.5);c.position.set(6,4,-6),a.add(c);let u=new Qe(new Kt(7.75,.28,7.75),new vt({color:9071135,roughness:.45,metalness:.5}));u.position.y=-.2,u.receiveShadow=!0,a.add(u);let f=new Qe(new Kt(7.55,.3,7.55),new vt({color:1060895,roughness:.9}));f.position.y=-.12,f.receiveShadow=!0,a.add(f);let d=new Qe(new hr(4.94,4.94),new vt({map:_y(),roughness:.85}));d.rotation.x=-Math.PI/2,d.position.y=.035,d.receiveShadow=!0,a.add(d),this.vault=new gn;let p=new Qe(new Mi(.62,.7,.18,40),new vt({color:9071135,metalness:.6,roughness:.35}));p.position.y=.12,p.castShadow=!0,p.receiveShadow=!0,this.vaultCore=new Qe(new Mi(.42,.48,1,40),new vt({color:Ai,emissive:7031308,emissiveIntensity:.6,metalness:.7,roughness:.25})),this.vaultCore.castShadow=!0,this.vaultRing=new Qe(new dr(.85,.035,10,64),new vt({color:ti,emissive:ti,emissiveIntensity:.9})),this.vaultRing.rotation.x=Math.PI/2,this.vaultRing.position.y=.06,this.vault.add(p,this.vaultCore,this.vaultRing),this.vault.position.set(0,0,.45),a.add(this.vault),this.setVault(0);let g=vy.map(m=>new vt({map:yy(m),roughness:.4}));this.die=new Qe(new Kt(.52,.52,.52),g),this.die.castShadow=!0,this.die.position.set(1.55,.3,1.25),a.add(this.die),this.setDie(1,!1),this.crisis=new Qe(new dr(.5,.04,10,48),new vt({color:11945530,emissive:11945530,emissiveIntensity:1.2})),this.crisis.rotation.x=Math.PI/2,this.crisis.visible=!1,a.add(this.crisis),this.hoverMesh=null,this.controls=new ya(o,s.domElement),Object.assign(this.controls,{enablePan:!1,enableDamping:!0,dampingFactor:.08,minDistance:7,maxDistance:18,minPolarAngle:.25,maxPolarAngle:1.15,rotateSpeed:.6}),this.controls.target.set(0,0,.35),this.mobile&&(this.controls.enabled=!1,s.domElement.style.touchAction="pan-y"),this.ray=new da,this.ptr=new we,this.down=null,s.domElement.addEventListener("pointerdown",m=>{this.down=[m.clientX,m.clientY]}),s.domElement.addEventListener("pointerup",m=>{if(!this.down||Math.hypot(m.clientX-this.down[0],m.clientY-this.down[1])>6)return;let h=this.pick(m);h!==null&&this.onSelect(h)}),s.domElement.addEventListener("pointermove",m=>{if(this.mobile)return;let h=this.pick(m);this.hover(h),s.domElement.style.cursor=h!==null?"pointer":"grab"}),this.ro=new ResizeObserver(()=>this.resize()),this.ro.observe(e),this.clock=new ha,this.anims=[];let _=()=>{this.frame=requestAnimationFrame(_),this.tick()};_()}pick(e){let t=this.renderer.domElement.getBoundingClientRect();this.ptr.set((e.clientX-t.left)/t.width*2-1,-((e.clientY-t.top)/t.height)*2+1),this.ray.setFromCamera(this.ptr,this.camera);let n=this.ray.intersectObjects([...this.tiles.values(),...[...this.buildings.values()].flatMap(r=>r.children)],!1);for(let r of n){let s=r.object;for(;s&&s.userData.stop===void 0;)s=s.parent;if(s)return s.userData.stop}return null}hover(e){if(this.hoverId!==e){if(this.hoverId!==void 0&&this.hoverId!==null){let t=this.tiles.get(this.hoverId);t&&(t.position.y=0)}if(this.hoverId=e,e!==null){let t=this.tiles.get(e);t&&(t.position.y=.05)}}}resize(){let e=this.container.clientWidth,t=this.container.clientHeight;!e||!t||(this.renderer.setSize(e,t),this.camera.aspect=e/t,this.camera.updateProjectionMatrix(),this.fit())}fit(){let e=this.camera,t=e.aspect||1,n=(this.mobile?66:52)*Math.PI/180,r=Math.tan(e.fov*Math.PI/360),s=r*t,a=Math.max(4.1/s,(this.mobile?3.2:3.55)/r)+(this.mobile?1.5:.7),o=this.mobile?-.12:.15;e.position.set(0,Math.sin(n)*a,Math.cos(n)*a+o),e.lookAt(0,0,o),this.controls&&(this.controls.target.set(0,0,o),this.controls.update())}update(e,t){for(let a of e.stops){let o=e.districts.find(d=>d.id===a.id),l=a.hood?e.neighborhoods[a.hood]:null,c=(e.coins||[]).find(d=>d.stop===a.id)||null,u=c&&c.image?this.image(c.image,a.id):null,f=`${o?`${o.level}:${o.xp}:${o.next}`:"s"}|${c?`${c.mint}:${c.grownLamports}:${u&&u.complete?1:0}`:"-"}`;this.sig.get(a.id)!==f&&(this.sig.set(a.id,f),this.buildTile(a,o,l,c,u))}let n=e.event;if(n&&n.kind==="crisis"){let a=Zr(n.target);this.crisis.position.set(a.x,.17,a.z),this.crisis.visible=!0}else this.crisis.visible=!1;let r=e.vault;this.setVault((r.progress-r.milestone*r.milestoneSize)/r.milestoneSize,r.milestone),this.lastCity=e,this.lastMe=t;for(let a of this.others)this.scene.remove(a);this.others=[];let s=new Map;for(let a of e.players)t.signedIn&&a.name===t.user.name||(s.has(a.position)||s.set(a.position,[]),s.get(a.position).push(a));for(let[a,o]of s){let l=Zr(a);o.slice(0,6).forEach((c,u)=>{let f=Th(this.colorFor(c.seed||c.name),.75),d=u/Math.min(6,o.length)*Math.PI*2;f.position.set(l.x-.25+Math.cos(d)*.12,_n+.01,l.z+.22+Math.sin(d)*.08),this.scene.add(f),this.others.push(f)})}if(t.signedIn){let a=this.colorFor(t.user.seed||t.user.name);(!this.me||this.myColor!==a)&&(this.me&&this.scene.remove(this.me),this.me=Th(a,1.35,!0),this.myColor=a,this.scene.add(this.me),this.myPos=null),(this.myPos===null||!this.moving&&this.myPos!==t.position)&&this.placeMe(t.position)}else this.me&&(this.scene.remove(this.me),this.me=null)}image(e,t){let n=this.imgs.get(e);return n||(n=new Image,n.decoding="async",n.onload=()=>{this.sig.delete(t),this.lastCity&&this.update(this.lastCity,this.lastMe)},n.src=e,this.imgs.set(e,n)),n}colorFor(e){let t=["#e2b33c","#c9972b","#8fb6dd","#9fd8b2","#f2a99e","#d9cba6","#b8d0e8","#f3d68f"],n=0;for(let r of String(e||"x"))n=n*31+r.charCodeAt(0)>>>0;return t[n%t.length]}spot(e){let t=Zr(e);return new O(t.x+.18,_n+.01,t.z+.12)}placeMe(e){this.me&&(this.myPos=e,this.me.position.copy(this.spot(e)))}buildTile(e,t,n,r=null,s=null){let a=this.tiles.get(e.id);a&&(this.scene.remove(a),a.material[2].map.dispose());let o=new vt({color:r?9071135:t?15260864:1522989,roughness:.6,metalness:r?.4:0}),l=new vt({map:r?gy(e,t,n,r,s):xy(e,t,n),roughness:.7}),c=this.coinMeshes.get(e.id);if(c&&(this.scene.remove(c),this.coinMeshes.delete(e.id)),r){let w=new vt({color:Ai,metalness:.85,roughness:.25,emissive:4862472,emissiveIntensity:.5}),M=new Qe(new Mi(.15,.15,.035,36),w);M.rotation.x=Math.PI/2;let N=Zr(e.id);M.position.set(N.x+.3,_n+.62,N.z-.3),M.castShadow=!0,M.userData.stop=e.id,this.scene.add(M),this.coinMeshes.set(e.id,M)}let u=Hc-fy,f=new Qe(new Kt(u,_n,u),[o,o,l,o,o,o]),d=Zr(e.id);f.position.set(d.x,0,d.z),f.geometry.translate(0,_n/2,0),f.castShadow=!0,f.receiveShadow=!0,f.userData.stop=e.id,this.scene.add(f),this.tiles.set(e.id,f);let p=this.buildings.get(e.id);if(p&&this.scene.remove(p),!t){this.buildings.delete(e.id);return}let g=new gn;g.userData.stop=e.id;let _=new ze(n.color),m=new vt({color:_,roughness:.55,metalness:.1}),h=new vt({color:16773577,emissive:16766842,emissiveIntensity:.35,roughness:.3}),T=[[-.3,-.06],[.3,-.06],[-.1,-.12],[.1,-.12],[0,.02]];for(let w=0;w<t.level;w++){let M=.22+w*.12+(w===3?.14:0),N=new Qe(new Kt(.17,M,.17),m);N.position.set(T[w][0],_n+M/2,T[w][1]),N.castShadow=!0,N.receiveShadow=!0,N.userData.stop=e.id;let A=new Qe(new Kt(.175,.03,.175),h);A.position.set(T[w][0],_n+M*.7,T[w][1]),A.userData.stop=e.id,g.add(N,A)}if(!t.next){let w=new Qe(new oa(.13,.18,4),new vt({color:Ai,metalness:.8,roughness:.2,emissive:7031308}));w.position.set(0,_n+.22+4*.12+.09,.02),w.userData.stop=e.id,g.add(w)}g.position.set(d.x,0,d.z-.3),g.children.forEach(w=>{w.position.z*=.5,w.position.x*=.95}),this.scene.add(g),this.buildings.set(e.id,g),a&&(g.scale.setScalar(.01),this.tween(380,w=>g.scale.setScalar(.01+.99*this.ease(w))))}setVault(e,t=0){let n=Math.max(0,Math.min(1,e||0)),r=.25+n*1.4+Math.min(3,t)*.15;this.vaultCore.scale.y=r,this.vaultCore.position.y=.21+r/2,this.vaultRing.material.emissiveIntensity=.4+n*1.4}setDie(e,t=!0){let[n,r]=Sy[e]||[0,0];if(!t)return this.die.rotation.set(n,0,r),Promise.resolve();let s=this.die.rotation.clone(),a=2+Math.floor(Math.random()*2),o=new Zt(n+a*Math.PI*2,(Math.random()-.5)*.6,r+a*Math.PI*2),l=.3;return this.tween(900,c=>{let u=this.ease(c);this.die.rotation.set(s.x+(o.x-s.x)*u,s.y+(o.y-s.y)*u,s.z+(o.z-s.z)*u),this.die.position.y=l+Math.sin(c*Math.PI)*1.1}).then(()=>{this.die.rotation.set(n,o.y,r),this.die.position.y=l})}async move(e,t){this.moving=!0,await this.setDie(t,!0);for(let n of e){if(!this.me)break;let r=this.me.position.clone(),s=this.spot(n);await this.tween(240,o=>{this.me.position.lerpVectors(r,s,o),this.me.position.y=_n+.01+Math.sin(o*Math.PI)*.35});let a=this.tiles.get(n);a&&this.tween(200,o=>{a.position.y=Math.sin(o*Math.PI)*.06}),this.myPos=n}this.moving=!1}ease(e){return e<.5?4*e*e*e:1-Math.pow(-2*e+2,3)/2}tween(e,t){return new Promise(n=>this.anims.push({t0:performance.now(),ms:e,fn:t,res:n}))}tick(){let e=performance.now(),t=this.clock.getElapsedTime();if(this.anims=this.anims.filter(n=>{let r=Math.min(1,(e-n.t0)/n.ms);return n.fn(r),r>=1?(n.res(),!1):!0}),this.crisis.visible){let n=1+Math.sin(t*4)*.08;this.crisis.scale.set(n,n,n)}this.vaultRing.rotation.z=t*.4;for(let[n,r]of this.coinMeshes)r.rotation.z=t*1.6+n,r.position.y=_n+.62+Math.sin(t*2+n)*.04;this.me&&this.me.userData.ring&&(this.me.userData.ring.material.emissiveIntensity=.6+Math.sin(t*3)*.3),this.controls.enabled&&this.controls.update(),this.renderer.render(this.scene,this.camera)}};var My=function(i,e,t,n){if(t==="a"&&!n)throw new TypeError("Private accessor was defined without a getter");if(typeof e=="function"?i!==e||!n:!e.has(i))throw new TypeError("Cannot read private member from an object whose class did not declare it");return t==="m"?n:t==="a"?n.call(i):n?n.value:e.get(i)},by=function(i,e,t,n,r){if(n==="m")throw new TypeError("Private method is not writable");if(n==="a"&&!r)throw new TypeError("Private accessor was defined without a setter");if(typeof e=="function"?i!==e||!r:!e.has(i))throw new TypeError("Cannot write private member to an object whose class did not declare it");return n==="a"?r.call(i,t):r?r.value=t:e.set(i,t),t},Sa,Kr,Ma=new Set;function wy(i){Jr=void 0,Ma.add(i)}function Ey(i){Jr=void 0,Ma.delete(i)}var _r={};function Gc(){if(Kr||(Kr=Object.freeze({register:Rh,get:Ty,on:Ay}),typeof window>"u"))return Kr;let i=Object.freeze({register:Rh});try{window.addEventListener("wallet-standard:register-wallet",({detail:e})=>e(i))}catch(e){console.error(`wallet-standard:register-wallet event listener could not be added
`,e)}try{window.dispatchEvent(new Vc(i))}catch(e){console.error(`wallet-standard:app-ready event could not be dispatched
`,e)}return Kr}function Rh(...i){return i=i.filter(e=>!Ma.has(e)),i.length?(i.forEach(e=>wy(e)),_r.register?.forEach(e=>Ph(()=>e(...i))),function(){i.forEach(t=>Ey(t)),_r.unregister?.forEach(t=>Ph(()=>t(...i)))}):()=>{}}var Jr;function Ty(){return Jr||(Jr=[...Ma]),Jr}function Ay(i,e){return _r[i]?.push(e)||(_r[i]=[e]),function(){_r[i]=_r[i]?.filter(n=>e!==n)}}function Ph(i){try{i()}catch(e){console.error(e)}}var Vc=class extends Event{get detail(){return My(this,Sa,"f")}get type(){return"wallet-standard:app-ready"}constructor(e){super("wallet-standard:app-ready",{bubbles:!1,cancelable:!1,composed:!1}),Sa.set(this,void 0),by(this,Sa,e,"f")}preventDefault(){throw new Error("preventDefault cannot be called")}stopImmediatePropagation(){throw new Error("stopImmediatePropagation cannot be called")}stopPropagation(){throw new Error("stopPropagation cannot be called")}};Sa=new WeakMap;var Lh="solana:signMessage",Dh="standard:connect",Ih="standard:disconnect";function Wc(i){let e="";for(let t of i)e+=String.fromCharCode(t);return btoa(e)}function Xc(){let{get:i}=Gc(),e=i().filter(n=>n.features[Dh]&&n.features[Lh]&&n.chains.some(r=>r.startsWith("solana:"))).map(n=>({name:n.name,icon:n.icon,kind:"standard",ref:n})),t=window.phantom&&window.phantom.solana||(window.solana&&window.solana.isPhantom?window.solana:null);return t&&!e.some(n=>/phantom/i.test(n.name))&&e.push({name:"Phantom",icon:null,kind:"legacy",ref:t}),e}function Uh(i){let{on:e}=Gc();return e("register",i)}function Nh(){return/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)}function Oh(){return`https://phantom.app/ul/browse/${encodeURIComponent(location.href)}?ref=${encodeURIComponent(location.origin)}`}async function Fh(i){if(i.kind==="legacy")return{address:(await i.ref.connect()).publicKey.toString(),account:null};let{accounts:e}=await i.ref.features[Dh].connect(),t=e.find(n=>n.chains.some(r=>r.startsWith("solana:")))||e[0];if(!t)throw new Error("The wallet didn't share an account.");return{address:t.address,account:t}}async function Cy(i,e,t){let n=new TextEncoder().encode(t);if(i.kind==="legacy"){let s=await i.ref.signMessage(n,"utf8");return Wc(s.signature)}let[r]=await i.ref.features[Lh].signMessage({account:e,message:n});return Wc(r.signature)}async function Bh(i,{purpose:e="login",onMessage:t}={}){let{address:n,account:r}=await Fh(i),s=await gt.post("/api/auth/nonce",{address:n,purpose:e});t&&t(s.message);let a=await Cy(i,r,s.message);return gt.post("/api/auth/verify",{address:n,nonce:s.nonce,signature:a,purpose:e})}var kh="solana:signTransaction";function Ry(i){let e=atob(i),t=new Uint8Array(e.length);for(let n=0;n<e.length;n++)t[n]=e.charCodeAt(n);return t}async function zh(i,e){let t=Xc().filter(r=>r.kind==="standard"&&r.ref.features[kh]),n=e&&e.kind==="standard"?[e,...t.filter(r=>r.ref!==e.ref)]:t;if(!n.length)throw new Error("No wallet that can sign transactions was found. Open TEK CITY in Phantom or install the Phantom extension.");for(let r of n){let{address:s,account:a}=await Fh(r);if(s===i)return{w:r,account:a}}throw new Error(`Switch your wallet to the account linked to TEK CITY (${i.slice(0,4)}\u2026${i.slice(-4)}) and try again.`)}async function Hh({w:i,account:e},t){let[n]=await i.ref.features[kh].signTransaction({account:e,transaction:Ry(t),chain:"solana:mainnet"});return Wc(n.signedTransaction)}async function Vh(i){try{if(!i)return;i.kind==="legacy"?await i.ref.disconnect():i.ref.features[Ih]&&await i.ref.features[Ih].disconnect()}catch{}}var wt=(i,...e)=>i.append(...e.flat().filter(t=>t!=null&&t!==!1)),Ci=i=>(Number(i)/1e9).toLocaleString(void 0,{maximumFractionDigits:3}),Gh=i=>Math.round(Number(i)*1e9);function qh(i,e){return(i.coins||[]).find(t=>t.stop===e)||null}async function ba(i,e,t){let n=i.me.user.wallet&&i.me.user.wallet.address;if(!n)throw new Error("Link your wallet first.");t("Opening your wallet. Review the transaction and approve it.");let r=await zh(n,i.wallet);i.wallet=r.w;let s=await Hh(r,e.transaction);return t("Sent. Waiting for Solana to confirm\u2026"),gt.post("/api/launchpad/submit",{intentId:e.intentId,signedTx:s})}function Wh(i){return new Promise((e,t)=>{if(!i)return t(new Error("Pick an image for your coin."));if(!/^image\/(png|jpeg|gif|webp)$/.test(i.type))return t(new Error("Use a PNG, JPG, GIF, or WebP image."));if(i.size>15e5)return t(new Error("Image must be under 1.5 MB."));let n=new FileReader;n.onload=()=>e(n.result),n.onerror=()=>t(new Error("Couldn't read that image.")),n.readAsDataURL(i)})}function Xh(i,e,t){let n=v("input",{type:"number",step:"0.01",min:String(i/1e9),max:String(e/1e9),value:String(t/1e9),class:"sol-input",inputmode:"decimal"}),r=v("div",{class:"presets"},[.05,.1,.25,.5,e/1e9].filter((s,a,o)=>s>=i/1e9&&s<=e/1e9&&o.indexOf(s)===a).map(s=>v("button",{type:"button",onclick:()=>{n.value=String(s),n.dispatchEvent(new Event("input"))}},s===e/1e9?`Max ${Ci(e)}`:`${s} SOL`)));return{input:n,el:v("div",{class:"sol-field"},v("div",{class:"row"},n,v("span",{class:"unit"},"SOL")),r)}}function Yh(i,e,t,n){let r=e.city.launchpad,s=qh(e.city,t.id),a=e.me,o=a.signedIn&&a.position===t.id,l=a.signedIn&&a.user.wallet,c=v("div",{class:"coin-sec"});if(wt(i,c),t.type==="station"){wt(c,v("p",{class:"small ink2"},"Central Station is the start. Spin to land on a space, then launch or grow a coin there."));return}if(t.type==="vault"&&wt(c,v("div",{class:"jackpot-note"},Te("vault"),v("span",{},v("b",{},"Jackpot space. "),"Land here on a spin to win the biggest share of the community rewards pool."))),s?(wt(c,v("div",{class:"coin-card"},s.image?v("img",{src:s.image,alt:"",class:"coin-img"}):v("span",{class:"coin-img ph"},s.symbol.slice(0,2)),v("div",{},v("b",{},s.name),v("span",{class:"tick"},`$${s.symbol}`),v("small",{},`Launched by ${s.launcher||s.launcherWallet}`)),v("a",{class:"btn btn-ghost btn-sm",href:s.pumpUrl,target:"_blank",rel:"noopener"},Te("external-link"),"Pump.fun")),v("div",{class:"kv"},v("div",{},v("div",{class:"k"},"Grown on this space"),v("div",{class:"v"},`${Ci(s.grownLamports)} SOL`)),v("div",{},v("div",{class:"k"},"Buy-ins"),v("div",{class:"v"},String(s.grows+1))),v("div",{},v("div",{class:"k"},"Holding the spot"),v("div",{class:"v"},s.holder||"Open")),v("div",{},v("div",{class:"k"},"Take-over price"),v("div",{class:"v"},`${Ci(s.takeoverLamports)} SOL`)))),s.ready||wt(c,v("div",{class:"reason"},Te("info"),"Waiting for the launcher to confirm the 80/20 community fee split."))):wt(c,v("p",{class:"lede-sm"},"No coin here yet. Launch one and this space becomes your coin.")),!r.enabled){wt(c,v("div",{class:"reason"},Te("info"),"The launchpad opens soon."));return}if(!a.signedIn){wt(c,v("button",{class:"btn btn-primary",onclick:n.signIn},Te("wallet"),"Connect Phantom to play"));return}if(!l){wt(c,v("button",{class:"btn btn-primary",onclick:n.linkWallet},Te("wallet"),"Link Phantom to launch or grow coins"));return}if(!o){wt(c,v("div",{class:"reason"},Te("dice-5"),"Land on this space with a spin to launch or grow here."));return}let u=v("p",{class:"small ink2 lp-status",role:"status"}),f=g=>{u.textContent=g},d=async(g,_)=>{if(!e.busy){e.busy=!0,g.disabled=!0;try{await _()}catch(m){f(/reject|denied|cancel/i.test(String(m.message))?"Cancelled in your wallet. Nothing was sent.":m.message),n.toast(m.message,"err")}finally{e.busy=!1,g.disabled=!1,await n.refresh()}}};if(s&&s.ready){let g=Xh(r.minBuyLamports,r.maxBuyLamports,Math.min(r.maxBuyLamports,1e8)),_=v("button",{class:"btn btn-primary",type:"button"},Te("trending-up"),`Grow $${s.symbol}`);_.onclick=()=>d(_,async()=>{let m=await gt.post("/api/launchpad/grow",{stopId:t.id,lamports:Gh(g.input.value)}),h=await ba(e,m,f);f(h.message),n.toast(h.message,"gold")}),wt(c,v("div",{class:"lp-block"},v("h4",{},`Grow $${s.symbol}`),v("p",{class:"small ink2"},"Buy into this coin on Pump.fun. Your buy grows the space and its buildings."),g.el,_))}let p=s?Math.max(r.minBuyLamports,s.takeoverLamports):r.minBuyLamports;if(p<=r.maxBuyLamports){let g=v("input",{type:"text",maxlength:"32",placeholder:"Coin name",class:"txt"}),_=v("input",{type:"text",maxlength:"10",placeholder:"TICKER",class:"txt mono",autocapitalize:"characters"}),m=v("textarea",{maxlength:"280",rows:"2",placeholder:"Short description (optional)",class:"txt"}),h=v("input",{type:"file",accept:"image/png,image/jpeg,image/gif,image/webp",class:"file"}),T=v("img",{class:"lp-preview",alt:""});T.hidden=!0,h.addEventListener("change",async()=>{try{T.src=await Wh(h.files[0]),T.hidden=!1}catch(N){f(N.message)}});let w=Xh(p,r.maxBuyLamports,Math.max(p,Math.min(r.maxBuyLamports,5e7))),M=v("button",{class:`btn ${s?"btn-red":"btn-primary"}`,type:"button"},Te("rocket"),s?"Take over this space":"Launch coin on Pump.fun");M.onclick=()=>d(M,async()=>{let N=await Wh(h.files[0]);if(g.value.trim().length<2)throw new Error("Give your coin a name.");if(!/^[A-Za-z0-9]{2,10}$/.test(_.value.trim()))throw new Error("Ticker: 2 to 10 letters or numbers.");f("Uploading your coin image\u2026");let A=await gt.post("/api/launchpad/launch",{stopId:t.id,name:g.value.trim(),symbol:_.value.trim(),description:m.value.trim()||void 0,image:N,lamports:Gh(w.input.value)}),C=await ba(e,A,f);if(f(C.message),n.toast(C.message,"gold",{ms:8e3}),C.next){f("One more approval: confirm the 80/20 creator fee split (80% to you, 20% to TEK CITY community rewards).");let D=await ba(e,C.next,f);f(D.message),n.toast(D.message,"gold")}}),wt(c,v("div",{class:"lp-block"},v("h4",{},s?`Take over from $${s.symbol}`:"Launch your coin here"),v("p",{class:"small ink2"},s?`Launch a new coin on this space with a first buy of at least ${Ci(p)} SOL, matching $${s.symbol}'s biggest buy-in.`:"Launching is free on Pump.fun. Your first buy sets this space's take-over price. 80% of creator fees go to you, 20% to community rewards."),v("div",{class:"lp-form"},g,_,m,v("label",{class:"file-l"},Te("image"),"Coin image",h),T,v("div",{class:"k small ink2"},"First buy"),w.el),M))}else s&&wt(c,v("p",{class:"small ink2"},`Take-over needs more than the ${Ci(r.maxBuyLamports)} SOL per-transaction limit. Grow $${s.symbol} instead.`));if(s&&!s.ready&&a.user.name===s.launcher){let g=v("button",{class:"btn btn-primary",type:"button"},Te("check"),"Confirm 80/20 fee split");g.onclick=()=>d(g,async()=>{let _=await gt.post("/api/launchpad/split",{stopId:t.id}),m=await ba(e,_,f);f(m.message)}),wt(c,g)}wt(c,u)}function $h(i,e,t){let n=e.me,r=n.spins||{},s=e.city.stops[n.position],a=s?qh(e.city,s.id):null;wt(i,v("div",{class:"res res2"},v("div",{},v("span",{class:"k"},Te("coins"),"TEK CITY"),v("div",{class:"v"},r.wallet?Math.floor(r.balance||0).toLocaleString():"--")),v("div",{},v("span",{class:"k"},Te("dice-5"),"Spins"),v("div",{class:"v"},r.enabled?String(r.left??0):n.can.move?"0":"1"))),r.enabled?v("p",{class:"small muted"},r.wallet?`1 free spin per ${Number(r.tokensPerSpin).toLocaleString()} TEK CITY held. ${r.next?`${Math.ceil(r.next).toLocaleString()} more for your next spin.`:""}`:"Link Phantom. Every 500,000 TEK CITY you hold = 1 free spin."):v("p",{class:"small muted"},"1 free spin per round for now. Once TEK CITY launches, every 500,000 TEK CITY you hold = 1 free spin."),n.user.wallet?null:v("button",{class:"btn btn-primary",onclick:t.linkWallet},Te("wallet"),"Link Phantom"),v("button",{class:"btn btn-primary spin-btn",disabled:!!n.can.move||e.busy,onclick:()=>t.act("move")},Te("dice-5"),"Spin"),n.can.move?v("p",{class:"small ink2"},n.can.move):null,v("div",{class:"here"},v("span",{class:"muted"},"You're on"),v("b",{},a?`$${a.symbol}`:s?s.name:"--"),v("span",{class:"muted"},s&&s.type==="station"?"Spin to land on a space.":a?"Grow this coin or take the space over.":"Empty space. Launch your coin here."),s&&s.type!=="station"?v("button",{class:"btn btn-cream btn-sm mt8",onclick:()=>t.openDrawer(s.id)},Te("rocket"),a?"Open coin":"Launch here"):null))}function Zh(i,e){if(lt(i),!e){wt(i,v("p",{class:"small muted"},"Loading\u2026"));return}let t=e.rewards||{},r=59-new Date().getUTCMinutes();wt(i,v("div",{class:"pool"},v("span",{class:"k"},"Community pool"),v("b",{},`${Ci(t.poolLamports||0)} SOL`)),v("ul",{class:"pool-rules"},v("li",{},v("b",{},`${(t.jackpotBps||0)/100}%`)," to whoever lands on the Community Vault"),v("li",{},v("b",{},`${(t.hourlyBps||0)/100}%`),` split across top TEK CITY holders every hour \xB7 next in ${r}m`),v("li",{},"Grows with 20% of creator fees from every coin launched on the board")),(t.jackpots||[]).length?v("div",{class:"small"},v("div",{class:"k"},"Recent jackpots"),(t.jackpots||[]).slice(0,3).map(s=>v("div",{},`${s.display_name||"Player"} \xB7 ${Ci(s.lamports)} SOL`))):null,t.pool?null:v("p",{class:"small muted"},"Rewards wallet not configured yet."))}var He=(i,...e)=>i.append(...e.flat().filter(t=>t!=null&&t!==!1)),H={city:null,me:{signedIn:!1},config:null,lb:"today",drawer:null,busy:!1,wallet:null,lastRound:null};var Py={station:"train-front",vault:"vault",desk:"newspaper",workshop:"wrench",plaza:"megaphone"};function Jt(i,e="ok",t={}){let n=v("div",{class:`toast ${e}`},t.dice?v("span",{class:"dice"},String(t.dice)):Te(e==="err"?"triangle-alert":e==="gold"?"sparkles":e==="info"?"info":"circle-check"),v("div",{},i));ye("#toasts").append(n),zt(n),setTimeout(()=>n.remove(),t.ms||4800)}var fn=i=>Number(i||0).toLocaleString(),Ri=(i,e)=>`${Math.max(0,Math.min(100,e?i/e*100:0))}%`,ni=(i,e="")=>v("div",{class:`bar ${e}`},v("i",{style:{width:i}})),$c=i=>H.city&&H.city.districts.find(e=>e.id===i),Zc=i=>H.city&&H.city.stops[i];async function jh(){H.city=await gt.get("/api/state")}async function Iy(){H.me=await gt.get("/api/me")}async function kn(){try{await Promise.all([jh(),H.me.signedIn?Iy():Promise.resolve()]),Kc()}catch{}}var Kh=null;function Ly(i=250){clearTimeout(Kh),Kh=setTimeout(kn,i)}function Kc(){if(H.city){if(Et()&&Et().enabled){for(let e of["#goal-mini","#moods","#lb","#goal"]){let t=ye(e),n=t&&(t.closest(".panel")||t);n&&n.classList.add("lp-hide")}let i=ye("#player-panel h3");i&&(i.textContent="Your player")}Dy(),Uy(),Qh(),rd(),Ny(),ky(),sd(),ad(),zy(),Hy(),od(),H.drawer!==null&&ld(),zt()}}function Dy(){let i=H.city;ye("#round-no").textContent=i.round?`${i.round.number} / 96`:"--",ye("#day-label").textContent=i.day;let e=ye("#paused");e.classList.toggle("show",!!i.paused),e.textContent=i.paused?`City paused: ${i.pausedReason}. Your progress is safe.`:"",H.lastRound&&i.round&&H.lastRound!==i.round.key&&Jt(`Round ${i.round.number} is open. Energy refilled.`,"info"),H.lastRound=i.round&&i.round.key}function Uy(){let i=lt(ye("#account-slot"));if(H.me.signedIn){let e=H.me.user;He(i,v("button",{class:"profile-chip",onclick:ud,"aria-label":"Your profile"},xs(e.name,e.seed),v("span",{},e.name),e.wallet?v("span",{class:"verified",title:`Verified wallet ${e.wallet.short}`},Te("badge-check")):null))}else He(i,v("button",{class:"btn btn-cream btn-sm",onclick:()=>hn()},Te("play"),"Play as guest"),Aa()?v("button",{class:"btn btn-ghost btn-sm",onclick:()=>hn(!0)},Te("wallet"),"Connect wallet"):null)}function Aa(){return!!(H.config&&H.config.features.walletConnect)}function qc({id:i,ic:e,title:t,sub:n,cost:r,reason:s,onclick:a,primary:o}){return v("button",{class:`action ${o?"primary":""}`,disabled:!!s||H.busy,onclick:a,"data-act":i,title:s||""},v("span",{class:"ic"},Te(e)),v("span",{},v("b",{},t),v("small",{},s||n)),r?v("span",{class:"cost"},r):v("span"))}function Qh(){let i=lt(ye("#player"));if(!H.me.signedIn){He(i,v("div",{class:"signin"},v("p",{},"Join the city to check in, ride the Transit Line, and build districts with everyone else."),v("button",{class:"btn btn-primary",onclick:()=>hn()},Te("play"),"Play as guest"),Aa()?v("button",{class:"btn btn-ghost",onclick:()=>hn(!0)},Te("wallet"),"Sign in with wallet"):null,v("p",{class:"muted"},"Wallets are optional and only used for identity. TEK CITY never asks for your seed phrase or private key.")));return}if(Et()&&Et().enabled){$h(i,H,ed);return}let e=H.me,t=e.resources,n=Zc(e.position);He(i,v("div",{class:"res"},v("div",{class:"energy"},v("span",{class:"k"},Te("zap"),"Energy"),v("div",{class:"v"},`${t.energy}`,v("small",{class:"muted"},`/${t.maxEnergy}`))),v("div",{class:"credits"},v("span",{class:"k"},Te("coins"),"Credits"),v("div",{class:"v"},fn(t.build_credits))),v("div",{class:"influence"},v("span",{class:"k"},Te("star"),"Influence"),v("div",{class:"v"},fn(t.influence_today)))),v("div",{class:"energy-bar"},ni(Ri(t.energy,t.maxEnergy))),v("div",{class:"actions"},qc({id:"checkin",ic:"circle-check",title:"Check in",sub:"Collect Build Credits, +1 Energy, +1 Influence",reason:e.can.checkin,onclick:()=>yn("checkin"),primary:!e.can.checkin}),qc({id:"move",ic:"train-front",title:"Ride the Transit Line",sub:"Server rolls 1 to 6. Land on a district to build on site.",cost:"2 \u26A1",reason:e.can.move,onclick:()=>yn("move")}),qc({id:"contribute",ic:"hammer",title:"Contribute",sub:`${e.contributionsLeft} of ${H.city.rules.contributionsPerRound} left this round. Tap a district.`,cost:"1 \u26A1",reason:e.can.contribute,onclick:()=>Bn(n&&n.type==="district"?n.id:nd())})),v("div",{class:"here"},v("span",{class:"muted"},"You're at"),v("b",{},n?n.name:"--"),e.onSite!==null?v("span",{},"On site: contributions here earn 1.5x District XP this round."):v("span",{class:"muted"},n&&n.text?n.text:"Ride the line to reach a district.")),e.badges.length?v("div",{class:"badges"},e.badges.map(r=>v("span",{title:r.description},r.name))):null,v("div",{class:"mt12"},v("button",{class:"btn btn-ghost btn-sm",onclick:()=>Ta(0)},Te("circle-help"),"How to play")))}var Et=()=>H.city&&H.city.launchpad,ed={signIn:()=>{Pi(),hn(!0)},linkWallet:()=>{Pi(),hn(!0)},toast:(i,e,t)=>Jt(i,e,t),refresh:()=>kn(),act:(i,e)=>yn(i,e),openDrawer:i=>Bn(i)};async function td(){try{H.lpInfo=await gt.get("/api/launchpad/info"),H.city&&sd()}catch{}}setInterval(td,6e4);function nd(){let i=H.city.districts.find(e=>e.next);return i?i.id:1}var Ea=window.matchMedia("(max-width: 900px)");Ea.addEventListener("change",()=>Kc());function Ny(){let i=Ea.matches||H.b3?ye("#event"):ye("#event-m");i&&lt(i);let e=lt(Ea.matches||H.b3?ye("#event-m"):ye("#event")),t=H.city.event;if(!t||Et()&&Et().enabled)return;if(t.kind==="crisis"){let s=$c(t.target);He(e,v("div",{class:"event crisis"},v("div",{class:"eic"},Te("siren")),v("div",{},v("span",{class:"tag"},`City crisis \xB7 Severity ${t.severity}`),v("h2",{},t.title.split(" \xB7")[0]),v("p",{},t.body),v("div",{class:"crisis-meter"},ni(Ri(t.progress,t.requirement)),v("span",{class:"mono"},`${fn(t.progress)} / ${fn(t.requirement)} District XP at ${s?s.name:"?"}`)),v("div",{class:"mt12"},v("button",{class:"btn btn-red btn-sm",onclick:()=>Bn(t.target),disabled:!H.me.signedIn},Te("hammer"),`Help ${s?s.name:""}`)))));return}let n=H.me.signedIn?H.me.can.vote:"Join the city to vote.",r=(t.tally||[]).reduce((s,a)=>s+a,0);He(e,v("div",{class:"event"},v("div",{class:"eic"},Te("gavel")),v("div",{},v("span",{class:"tag"},"City Brief \xB7 decided at the tick"),v("h2",{},t.title),v("p",{},t.body),v("div",{class:"options"},t.options.map((s,a)=>v("button",{class:"opt",disabled:!!n||H.busy,onclick:()=>yn("vote",{option:a}),title:n||""},v("b",{},s.label),v("small",{},s.hint||""),v("span",{class:"votes"},`${t.tally?t.tally[a]:0} vote${t.tally&&t.tally[a]===1?"":"s"}${r?` \xB7 ${Math.round((t.tally[a]||0)/r*100)}%`:""}`)))),n&&H.me.signedIn?v("p",{class:"mt12 small"},n):null)))}function Oy(i){return i<=6?{row:7,col:7-i,side:"bottom"}:i<=12?{row:7-(i-6),col:1,side:"left"}:i<=18?{row:1,col:1+(i-12),side:"top"}:{row:1+(i-18),col:7,side:"right"}}var Fy=new Set([0,6,12,18]),id=!/[?&]view=2d/.test(location.search)&&Ch();function By(){let i=ye("#board"),e=H.city;if(!H.b3){lt(i),i.className="board3d";let r=v("div",{class:"stage",id:"stage"});He(i,r,v("div",{class:"hud3d",id:"hud3d"}),v("div",{class:"hint3d"},Ea.matches?"Tap a space to open it":"Drag to rotate \xB7 scroll to zoom \xB7 click a space"));try{H.b3=new va(r,{onSelect:s=>Bn(s)})}catch{return H.b3=null,H.no3d=!0,i.className="board",rd()}}H.b3.update(e,H.me);let t=lt(ye("#hud3d"));He(t,v("button",{class:"btn btn-primary roll",id:"roll-btn",disabled:!H.me.signedIn||!!H.me.can.move||H.busy,onclick:()=>yn("move")},Te("dice-5"),Et()&&Et().enabled?"Spin":"Roll"),v("small",{class:"roll-why"},H.me.signedIn?H.me.can.move||(Et()&&Et().spins?`${H.me.spins&&H.me.spins.left||0} free spins left`:"Costs 2 Energy \xB7 once per round"):"Connect Phantom to play"));let n=lt(ye("#legend"));for(let r of Object.values(e.neighborhoods))He(n,v("span",{style:{"--hc":r.color}},v("i"),`${r.name} \xB7 ${r.levels} lv`))}function rd(){if(id&&!H.no3d)return By();let i=lt(ye("#board")),e=H.city,t=new Map;for(let o of e.players)t.has(o.position)||t.set(o.position,[]),t.get(o.position).push(o);let n=H.me.signedIn?H.me.position:null,r=e.event&&e.event.kind==="crisis"?e.event.target:null;for(let o of e.stops){let l=Oy(o.id),c=$c(o.id),u=o.hood?e.neighborhoods[o.hood]:null,f=["space",`side-${l.side}`,Fy.has(o.id)?"corner":"",c?"prop":`special ${o.type}`,o.id===r?"target":"",o.id===n?"mine":"",c&&!c.next?"complete":""].join(" "),d=(t.get(o.id)||[]).filter(g=>!(H.me.signedIn&&g.name===H.me.user.name)),p=v("button",{class:f,"data-stop":o.id,style:{"grid-row":l.row,"grid-column":l.col,...u?{"--hc":u.color}:{}},onclick:()=>Bn(o.id),"aria-label":`${o.name}${c?`, Level ${c.level}`:""}`},c?v("span",{class:"band"},v("span",{class:"floors"},[1,2,3,4,5].map(g=>v("i",{class:g<=c.level?"on":""})))):null,v("span",{class:"nm"},o.name),c?v("span",{class:"lvl"},`LV ${c.level}`):v("span",{class:"sic"},Te(Py[o.type]||"map-pin")),c?v("span",{class:"xp"},v("i",{style:{width:c.next?Ri(c.xp,c.next):"100%"}})):v("span",{class:"sub"},o.type==="desk"?"Dispatch":o.type==="station"?"GO \xB7 +25":o.type==="vault"?"Vault":o.type==="workshop"?"+20 \xB7 +1\u26A1":"+5 Inf"),v("span",{class:"tokens"},d.slice(0,4).map(g=>xs(g.name,g.seed)),d.length>4?v("span",{class:"more"},`+${d.length-4}`):null));He(i,p)}let s=v("div",{class:"center"},v("div",{class:"center-top"},v("div",{class:"brand"},v("span",{class:"kick"},"Community board"),v("b",{},"TEK CITY")),v("div",{class:"dice-box"},v("div",{class:"die",id:"die"},Yc(H.lastRoll||0)),v("button",{class:"btn btn-primary roll",id:"roll-btn",disabled:!H.me.signedIn||!!H.me.can.move||H.busy,onclick:()=>yn("move"),title:H.me.signedIn?H.me.can.move||"":"Join to roll"},Te("dice-5"),"Roll"),v("small",{class:"roll-why"},H.me.signedIn?H.me.can.move||"Costs 2 Energy \xB7 once per round":"Join the city to roll"))),v("div",{id:"event"}));He(i,s),H.me.signedIn&&He(i,v("span",{class:"my-token",id:"my-token"},xs(H.me.user.name,H.me.user.seed,"me"))),requestAnimationFrame(()=>Jc(n,!1));let a=lt(ye("#legend"));for(let[o,l]of Object.entries(e.neighborhoods))He(a,v("span",{style:{"--hc":l.color}},v("i"),`${l.name} \xB7 ${l.levels} lv`))}function Yc(i){let e={0:[],1:[5],2:[1,9],3:[1,5,9],4:[1,3,7,9],5:[1,3,5,7,9],6:[1,3,4,6,7,9]}[i]||[];return[1,2,3,4,5,6,7,8,9].map(t=>v("i",{class:e.includes(t)?"on":""}))}function Jc(i,e=!0){let t=ye("#my-token"),n=ye("#board");if(!t||i===null||i===void 0)return;let r=ye(`.space[data-stop="${i}"]`,n);if(!r)return;let s=n.getBoundingClientRect(),a=r.getBoundingClientRect();t.style.transition=e?"transform 170ms ease-out":"none",t.style.transform=`translate(${a.left-s.left+a.width/2-14}px, ${a.top-s.top+a.height/2-6}px)`}window.addEventListener("resize",()=>requestAnimationFrame(()=>Jc(H.me.signedIn?H.me.position:null,!1)));function ky(){let i=H.city.goal,e=H.city,t=lt(ye("#goal"));He(t,v("div",{class:`stab ${e.stability<=30?"low":""}`},v("div",{class:"k"},"Stability"),v("div",{class:"v"},`${e.stability}%`),ni(`${e.stability}%`)),v("div",{class:"lv"},v("div",{class:"k"},"District levels"),v("div",{class:"v"},`${i.levels} / ${i.levelsNeeded}`),ni(Ri(i.levels,i.levelsNeeded))),v("div",{class:"vm"},v("div",{class:"k"},"Vault milestones"),v("div",{class:"v"},`${i.milestones} / ${i.milestonesNeeded}`),ni(Ri(i.milestones,i.milestonesNeeded))));let n=ye("#day-banner");n.className="day-banner",e.dayStatus==="thrived"?(n.classList.add("show","thrived"),n.textContent="TEK CITY THRIVES today. Goal complete: everyone who played earned the City Thrives badge. Keep building for the leaderboard."):e.dayStatus==="blackout"&&(n.classList.add("show","blackout"),n.textContent=e.recovery?`Blackout. Today's goal is lost. Recovery until round ${e.recovery}: contributions earn half XP.`:"Blackout. Today's goal is lost, but the city is back online. Build for tomorrow."),ye("#day-status").textContent=e.dayStatus==="active"?"in progress":e.dayStatus;let r=lt(ye("#goal-mini"));He(r,v("p",{},`Reach ${i.levelsNeeded} district levels and ${i.milestonesNeeded} Vault milestones before midnight UTC. Keep Stability above zero.`),v("p",{class:"mb0"},`Resets at 00:00 UTC. ${96-(e.round?e.round.number:0)} rounds left today.`))}function sd(){if(Et()&&Et().enabled){let c=ye("#vault").closest(".panel").querySelector("h3");c&&c.firstChild&&(c.firstChild.textContent="Community Rewards "),ye("#vault-ms").textContent="",Zh(ye("#vault"),H.lpInfo);return}let i=H.city.vault,e=i.progress-i.milestone*i.milestoneSize,t=Math.max(0,Math.min(1,e/i.milestoneSize)),n=2*Math.PI*50,r=lt(ye("#vault")),s="http://www.w3.org/2000/svg",a=document.createElementNS(s,"svg");a.setAttribute("viewBox","0 0 120 120");let o=document.createElementNS(s,"circle");o.setAttribute("class","trk"),o.setAttribute("cx",60),o.setAttribute("cy",60),o.setAttribute("r",50);let l=document.createElementNS(s,"circle");l.setAttribute("class","val"),l.setAttribute("cx",60),l.setAttribute("cy",60),l.setAttribute("r",50),l.setAttribute("stroke-dasharray",n.toFixed(1)),l.setAttribute("stroke-dashoffset",(n*(1-t)).toFixed(1)),a.append(o,l),He(r,v("div",{class:"vault-meter"},a,v("div",{class:"center"},v("b",{},`${Math.round(t*100)}%`),v("small",{},`${e} / ${i.milestoneSize}`))),v("p",{class:"vault-info"},"20% of every contribution fills the Vault. Each milestone unlocks a city-wide build boost and the Vault Keeper badge for active builders."),H.city.boosts.length?v("div",{class:"boosts"},H.city.boosts.map(c=>v("span",{},Te("sparkles"),c))):null),ye("#vault-ms").textContent=`Milestone ${i.milestone}`}function ad(){let i=H.city.leaderboard[H.lb],e=lt(ye("#lb"));if(!i.length){He(e,v("li",{class:"empty"},"No Influence earned yet. Be the first."));return}i.forEach((t,n)=>He(e,v("li",{class:H.me.signedIn&&t.name===H.me.user.name?"me":""},v("span",{class:"rk"},`${n+1}`),v("span",{},t.name,t.kind==="wallet"?" \u2713":""),v("span",{class:"pts"},fn(t.influence))))),Uo(".tabs button").forEach(t=>t.setAttribute("aria-selected",String(t.dataset.lb===H.lb)))}function zy(){let i=lt(ye("#moods"));for(let e of Object.values(H.city.moods)){let t=e.value>=70?"hi":e.value<=30?"lo":"";He(i,v("div",{class:`mood ${t}`},v("div",{class:"row"},v("span",{},e.name),v("span",{class:"mono"},`${e.value}`)),ni(`${e.value}%`),v("small",{},t==="hi"?`Happy: ${e.high}`:t==="lo"?`Unhappy: ${e.low}`:`Neutral. Over 70: ${e.high.toLowerCase()}.`)))}}function Hy(){let i=lt(ye("#feed"));for(let e of H.city.activity)He(i,v("li",{class:e.kind},v("time",{},Xu(e.at)),v("span",{},e.text)))}function od(){let i=lt(ye("#mobile-bar"));if(!H.me.signedIn){He(i,v("button",{onclick:()=>hn(),style:{"grid-column":"1 / -1"}},Te("play"),"Join the city",v("small",{},"Guest or wallet")));return}let e=H.me,t=Zc(e.position),n=(r,s,a,o,l)=>v("button",{disabled:!!a||H.busy,onclick:o},Te(r),s,v("small",{},a||l));if(Et()&&Et().enabled){He(i,n("dice-5","Spin",e.can.move,()=>yn("move"),`${e.spins&&e.spins.left||0} left`),n("rocket","This space",t&&t.type!=="station"?null:"Spin first",()=>Bn(t.id),"Launch / grow"),n("wallet",e.user.wallet?"Wallet":"Link",null,()=>e.user.wallet?ud():hn(!0),e.user.wallet?e.user.wallet.short:"Phantom"),n("vault","Rewards",null,()=>ye("#vault").scrollIntoView({behavior:"smooth",block:"center"}),"Pool"));return}He(i,n("circle-check","Check in",e.can.checkin,()=>yn("checkin"),"+Credits"),n("train-front","Ride",e.can.move,()=>yn("move"),"2 Energy"),n("hammer","Build",e.can.contribute,()=>Bn(t&&t.type==="district"?t.id:nd()),`${e.contributionsLeft} left`),H.city.event&&H.city.event.kind==="crisis"?n("siren","Crisis",null,()=>Bn(H.city.event.target),"Help now"):n("gavel","Vote",e.can.vote,()=>ye("#event").scrollIntoView({behavior:"smooth",block:"center"}),"City Brief"))}function Bn(i){H.drawer=i,ld(),ye("#drawer").classList.add("open"),ye("#scrim").classList.add("open"),ye("#drawer").setAttribute("aria-hidden","false"),zt(ye("#drawer"));let e=ye("#drawer .close");e&&e.focus()}function Pi(){H.drawer=null,ye("#drawer").classList.remove("open"),ye("#scrim").classList.remove("open"),ye("#drawer").setAttribute("aria-hidden","true")}var Wt=50;function ld(){let i=lt(ye("#drawer")),e=Zc(H.drawer);if(!e)return;let t=$c(e.id),n=e.hood?H.city.neighborhoods[e.hood]:null;n?i.style.setProperty("--hc",n.color):i.style.setProperty("--hc","#e2b33c");let r=v("header",{},v("span",{class:"band"}),v("span",{class:"kicker"},n?n.name:"Transit stop"),v("h2",{id:"dr-title"},e.name),v("span",{class:"muted ink2 small"},t?`Stop ${e.id} \xB7 Level ${t.level} of 5`:`Stop ${e.id}`),v("button",{class:"close",onclick:Pi,"aria-label":"Close"},Te("x"))),s=v("div",{class:"body"});if(He(i,r,s),Et()&&Et().enabled){t&&He(s,v("div",{class:"kv"},v("div",{},v("div",{class:"k"},"Level"),v("div",{class:"v"},`${t.level} / 5`)),v("div",{},v("div",{class:"k"},"Growth"),v("div",{class:"v"},t.next?`${fn(t.xp)} / ${fn(t.next)}`:"Complete"))),v("div",{class:"xpbar"},ni(t.next?Ri(t.xp,t.next):"100%"))),Yh(s,H,e,ed),zt(i);return}if(!t){He(s,v("p",{},e.text||""),v("p",{class:"small ink2"},"Special stops trigger when you land on them after riding the Transit Line. The server decides the roll.")),zt(i);return}let a=H.me,o=H.city.event&&H.city.event.kind==="crisis"&&H.city.event.target===t.id?H.city.event:null;if(He(s,v("div",{class:"kv"},v("div",{},v("div",{class:"k"},"Level"),v("div",{class:"v"},`${t.level} / 5`)),v("div",{},v("div",{class:"k"},"District XP"),v("div",{class:"v"},t.next?`${fn(t.xp)} / ${fn(t.next)}`:"Complete"))),v("div",{class:"xpbar"},ni(t.next?Ri(t.xp,t.next):"100%")),v("div",{class:"effect"},v("b",{},`${n.name} effect: `),n.effect),o?v("div",{class:"reason"},Te("siren"),`Crisis here: ${fn(o.progress)} / ${fn(o.requirement)} XP needed before the tick.`):null),!t.next){He(s,v("p",{},"This district is fully built for today. Help another district level up.")),zt(i);return}if(!a.signedIn){He(s,v("button",{class:"btn btn-primary",onclick:()=>{Pi(),hn()}},Te("play"),"Join to contribute")),zt(i);return}let l=Math.max(H.city.rules.minContribution,Math.min(H.city.rules.maxContribution,Math.floor(a.resources.build_credits/5)*5));Wt=Math.max(H.city.rules.minContribution,Math.min(Wt,l));let c=a.onSite===t.id,u=v("output",{},String(Wt)),f=v("p",{class:"preview"}),d=()=>{u.textContent=String(Wt),f.textContent=`About +${Math.round(Wt*(c?1.5:1))} District XP${c?" (on-site 1.5x)":""}, +${Math.floor(Wt/10)} Influence, +${Math.floor(Wt*.2)} Vault progress. Costs 1 Energy. Final XP is calculated by the server (citizen moods and boosts apply).`},p=_=>{Wt=Math.max(H.city.rules.minContribution,Math.min(l,Wt+_)),d()};d();let g=a.can.contribute||(a.resources.build_credits<H.city.rules.minContribution?"Not enough Build Credits.":null);He(s,v("div",{},v("div",{class:"k small ink2"},"Contribution (Build Credits)"),v("div",{class:"amount"},v("button",{onclick:()=>p(-5),"aria-label":"Less"},"\u2212"),u,v("button",{onclick:()=>p(5),"aria-label":"More"},"+"))),v("div",{class:"presets"},[25,50,100,200].filter(_=>_<=l).map(_=>v("button",{onclick:()=>{Wt=_,d()}},String(_))),v("button",{onclick:()=>{Wt=l,d()}},`Max ${l}`)),f,g?v("div",{class:"reason"},Te("info"),g):null,v("button",{class:"btn btn-primary",disabled:!!g||H.busy,onclick:()=>yn("contribute",{districtId:t.id,amount:Wt})},Te("hammer"),`Contribute ${Wt}`),v("p",{class:"small ink2"},c?"You're on site this round.":"Tip: land on this district with the Transit Line first to earn 1.5x XP.")),zt(i)}ye("#scrim").addEventListener("click",Pi);document.addEventListener("keydown",i=>{i.key==="Escape"&&(Pi(),Ii())});async function yn(i,e={}){if(!H.busy){H.busy=!0,Qh(),od(),zt();try{let t=await gt.action(i,e);i==="move"?(await Vy(t.path,t.roll),Jt(t.message,"ok",{dice:t.roll,ms:6e3}),t.jackpotWin&&t.jackpotWin.lamports>0&&Jt(`Jackpot: ${(t.jackpotWin.lamports/1e9).toFixed(3)} SOL from the community pool is on its way to your wallet.`,"gold",{ms:1e4}),Et()&&Et().enabled&&t.stop&&t.stop.type!=="station"&&setTimeout(()=>Bn(t.stop.id),600)):i==="contribute"?(Jt(t.message,"gold"),t.firstBadge&&Jt("Badge earned: First Brick","gold"),Pi()):Jt(t.message)}catch(t){Jt(t.message,"err"),t instanceof Bi&&t.code==="sign_in_required"&&(H.me={signedIn:!1},hn())}finally{H.busy=!1,await kn()}}}async function Vy(i=[],e){if(H.lastRoll=e,H.b3){await H.b3.move(i,e);return}let t=ye("#die");if(t){t.classList.add("rolling");for(let n=0;n<8;n++)lt(t),He(t,Yc(1+Math.floor(Math.random()*6))),await new Promise(r=>setTimeout(r,70));t.classList.remove("rolling"),lt(t),He(t,Yc(e))}H.lastRoll=e;for(let n of i){Jc(n,!0);let r=ye(`.space[data-stop="${n}"]`);r&&(r.classList.remove("hop"),r.offsetWidth,r.classList.add("hop")),await new Promise(s=>setTimeout(s,230))}}function jc(i){let e=lt(ye("#modal-box"));e.append(...i),ye("#modal").classList.add("open"),zt(e);let t=e.querySelector("input,button");t&&t.focus()}function Ii(){ye("#modal").classList.remove("open")}ye("#modal").addEventListener("click",i=>{i.target.id==="modal"&&Ii()});function Gy(){return v("div",{class:"note"},Te("shield-check"),v("span",{},"Signing in only signs a text message. It is not a transaction, costs nothing, and gives no access to funds. TEK CITY never asks for your seed phrase or private key."))}function hn(i=!1){let e=v("p",{class:"small",role:"status"}),t=v("input",{id:"guest-name",maxlength:20,minlength:2,placeholder:"Builder name",autocomplete:"nickname",value:""}),n=async()=>{let a=t.value.trim();if(!/^[A-Za-z0-9][A-Za-z0-9 _.-]{1,19}$/.test(a)){e.textContent="Use 2 to 20 letters, numbers, spaces, dots, dashes or underscores.";return}e.textContent="Joining\u2026";try{let o=await gt.post("/api/guest",{name:a});H.me=o.me,Ii(),await kn(),Jt(`Welcome to TEK CITY, ${a}.`),Qc()}catch(o){e.textContent=o.message}};t.addEventListener("keydown",a=>{a.key==="Enter"&&n()});let r=v("div",{},v("h2",{},"Join the city"),v("p",{class:"ink2"},"Play instantly as a guest. You can link a wallet later to keep a verified identity."),t,v("div",{class:"row"},v("button",{class:"btn btn-primary",onclick:n},Te("play"),"Play as guest"))),s=Aa()?cd(e):v("p",{class:"small ink2 mt16"},"Wallet sign-in is turned off right now.");jc(i?[s,v("hr",{class:"mt16"}),r,e]:[r,s,e])}function cd(i,{purpose:e="login",title:t="Or sign in with a Solana wallet"}={}){let n=v("div",{class:"wallet-list"}),r=()=>{lt(n);let s=Xc();for(let a of s)He(n,v("button",{onclick:()=>Wy(a,i,e)},a.icon?v("img",{src:a.icon,alt:""}):Te("wallet"),a.name,v("span",{class:"muted small"}," \xB7 signature only")));s.length||(Nh()?He(n,v("a",{class:"btn btn-cream",href:Oh(),rel:"noopener"},Te("wallet"),"Open TEK CITY in the Phantom app")):He(n,v("p",{class:"small ink2"},"No Solana wallet detected in this browser. Install a wallet extension such as Phantom from its official site, then reload this page."))),zt(n)};return r(),Uh(r),v("div",{class:"mt16"},v("h3",{},t),n,Gy())}async function Wy(i,e,t){e.textContent="Check your wallet. You'll be asked to sign a sign-in message (not a transaction).";try{let n=await Bh(i,{purpose:t});H.wallet=i,H.me=n.me,Ii(),await kn(),Jt(t==="reauth"?"Confirmed.":`Signed in as ${n.me.user.name}. Wallet verified.`),Qc()}catch(n){e.textContent=n&&/reject|denied|cancel/i.test(String(n.message))?"Request cancelled in your wallet. Nothing was signed.":n.message||"Wallet sign-in failed."}}function ud(){let i=H.me,e=i.user,t=v("p",{class:"small",role:"status"}),n=v("input",{maxlength:20,value:e.name}),r=async()=>{try{let a=await gt.post("/api/profile",{name:n.value.trim()});H.me=a.me,t.textContent="Saved.",await kn()}catch(a){t.textContent=a.message}},s=async()=>{try{await gt.post("/api/auth/logout",{}),await Vh(H.wallet),H.me={signedIn:!1},Ii(),await kn(),Jt("Signed out.","info")}catch(a){t.textContent=a.message}};jc([v("h2",{},"Your builder"),v("p",{class:"ink2"},e.wallet?`Verified wallet ${e.wallet.short} (signature only, ${H.config?H.config.solanaNetwork:"devnet"}).`:"Guest account. Link a wallet to keep a verified identity across devices."),v("label",{class:"small ink2"},"Display name"),n,v("div",{class:"row"},v("button",{class:"btn btn-ghost",onclick:r},"Save name")),v("h3",{class:"mt16"},"Badges"),i.badges.length?v("ul",{},i.badges.map(a=>v("li",{},v("b",{},a.name),` \xB7 ${a.description}`))):v("p",{class:"small ink2"},"No badges yet. Contribute to a district to earn First Brick."),!e.wallet&&Aa()?cd(t,{title:"Link a wallet"}):null,t,v("div",{class:"row"},v("button",{class:"btn btn-ghost",onclick:Ii},"Close"),v("button",{class:"btn btn-red",onclick:s},Te("log-out"),"Sign out"))].filter(Boolean))}var wa=[{ic:"landmark",t:"Welcome to TEK CITY",b:"A board game launchpad for Pump.fun. Every space on the board can become a coin. Spin, land on a space, and launch or grow the coin that's there."},{ic:"dice-5",t:"Free spins from TEK CITY",b:"Every 500,000 TEK CITY you hold gives you 1 free spin. Buy more and you get more spins. Link Phantom so the game can see your balance."},{ic:"rocket",t:"Launch or grow",b:"Empty space: launch your own coin on Pump.fun and the space becomes your coin. Space with a coin: grow it by buying in, or take the space over by launching with a first buy at least as big as its biggest buy-in."},{ic:"vault",t:"Community rewards",b:"20% of creator fees from every coin launched here fill the community pool. Land on the Community Vault to win the biggest share. Every hour, part of the pool is split across the top TEK CITY holders."},{ic:"wallet",t:"Your wallet, your keys",b:"You approve every launch and buy in your own Phantom wallet. TEK CITY never asks for your seed phrase or private key."}],Xy=0;function Ta(i=0){Xy=i;let e=wa[i];jc([v("div",{class:"tut-steps"},wa.map((t,n)=>v("i",{class:n<=i?"on":""}))),v("div",{class:"tut-ic"},Te(e.ic)),v("h2",{},e.t),v("p",{class:"ink2"},e.b),v("div",{class:"row"},v("button",{class:"btn btn-ghost",onclick:Jh},"Skip"),i>0?v("button",{class:"btn btn-ghost",onclick:()=>Ta(i-1)},"Back"):null,v("button",{class:"btn btn-primary",onclick:()=>i<wa.length-1?Ta(i+1):Jh()},i<wa.length-1?"Next":"Start building"))].filter(Boolean))}async function Jh(){Ii();try{localStorage.setItem("tc_tut","1")}catch{}if(H.me.signedIn&&!H.me.tutorialDone)try{await gt.post("/api/tutorial",{done:!0}),H.me.tutorialDone=!0}catch{}}function Qc(){let i=!1;try{i=localStorage.getItem("tc_tut")==="1"}catch{}H.me.signedIn&&!H.me.tutorialDone&&!i&&Ta(0)}function jr(){let i=H.city;if(!i||!i.round)return;let e=new Date(i.round.endsAt)-Date.now(),t=ye("#countdown-box");if(e<=0){ye("#countdown").textContent="settling",t.classList.add("urgent"),jr.wait||(jr.wait=!0,setTimeout(async()=>{jr.wait=!1,await kn()},4e3));return}let n=Math.floor(e/6e4),r=Math.floor(e/1e3)%60;ye("#countdown").textContent=`${String(n).padStart(2,"0")}:${String(r).padStart(2,"0")}`,t.classList.toggle("urgent",e<6e4)}function qy(){let i=Pr({transports:["websocket","polling"],withCredentials:!0}),e=-1;i.on("city",t=>{t.version!==e&&(e=t.version,Ly())}),i.on("connect",()=>{ye("#live-dot").textContent="live"}),i.on("disconnect",()=>{ye("#live-dot").textContent="reconnecting"})}Uo(".tabs button").forEach(i=>i.addEventListener("click",()=>{H.lb=i.dataset.lb,ad()}));(async function i(){zt();try{let[e,t]=await Promise.all([gt.session(),gt.get("/api/config"),id?Ah():null]);H.me=e.me,H.config=t,td(),await jh(),Kc(),H.me.signedIn?Qc():hn(location.hash==="#wallet")}catch(e){Jt(e.message||"Couldn't reach the city. Retrying\u2026","err"),setTimeout(i,5e3);return}setInterval(jr,1e3),jr(),setInterval(kn,3e4),qy()})();})();
