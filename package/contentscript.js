/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// identity function for calling harmony imports with the correct context
/******/ 	__webpack_require__.i = function(value) { return value; };
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 22);
/******/ })
/************************************************************************/
/******/ ({

/***/ 22:
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var debug = true;
var tabs = {};

function toggle(tab) {
  if (!tabs[tab.id]) {
    console.log('addTab', tab.id);
    addTab(tab);
  } else {
    console.log('deactivateTab', tab.id);
    deactivateTab(tab.id);
  }
}

function addTab(tab) {
  tabs[tab.id] = Object.create(Blackshrimp);
  tabs[tab.id].construct(tab);
}

function deactivateTab(id) {
  tabs[id].destroy();
}

function clearTab(id) {
  for (var tabId in tabs) {
    if (tabId == id) {
      delete tabs[tabId];
    }
  }
}

var lastBrowserAction = null;

// Icon click listener
chrome.browserAction.onClicked.addListener(function (tab) {
  toggle(tab);
  lastBrowserAction = Date.now();
});

// Runtime port connexion
chrome.runtime.onConnect.addListener(function (port) {
  tabs[port.sender.tab.id].initialize(port);
});

chrome.runtime.onSuspend.addListener(function () {
  for (var tabId in tabs) {
    console.log('tab ', tabId, ' deactive');
    tabs[tabId].deactivate(true);
  }
});

var Blackshrimp = {
  image: new Image(),
  canvas: document.createElement('canvas'),

  construct: function construct(tab) {
    this.tab = tab;

    this.onBrowserDisconnectClosure = this.onBrowserDisconnect.bind(this);
    this.receiveBrowserMessageClosure = this.receiveBrowserMessage.bind(this);

    var tabId = this.tab.id;
    chrome.tabs.executeScript(this.tab.id, { file: 'injected.js' });
    // chrome.tabs.executeScript(tabId, { file: 'vendors/jquery-3.2.1.min.js' }, function() {
    //   chrome.tabs.executeScript(tabId, { file: 'injected.js' });
    // });
    // chrome.tabs.insertCSS(this.tab.id, { file: 'css/injected.css' });

    // Set active icon
    chrome.browserAction.setIcon({
      tabId: this.tab.id,
      path: {
        16: 'assets/img/icon16_alt.png',
        32: 'assets/img/icon16@2x.png'
      }
    });

    this.worker = new Worker('worker.js');
    this.worker.onmessage = this.receiveWorkerMessage.bind(this);
    this.worker.postMessage({
      type: 'init',
      debug: debug
    });

    // this.captureTab();
  },

  destroy: function destroy(silent) {
    // if(!this.port){
    //   // not yet initialized
    //   this.alive = false;
    //   return;
    // }

    if (!silent) {
      this.port.postMessage({ type: 'destroy' });
    }

    // this.port.onMessage.removeListener(this.receiveBrowserMessageClosure);
    this.port.onDisconnect.removeListener(this.onBrowserDisconnectClosure);

    // this.port.postMessage({ type: 'destroy' });
    this.worker.postMessage({
      type: 'destroy'
    });

    // Set back normal Icon
    chrome.browserAction.setIcon({
      tabId: this.tab.id,
      path: {
        16: 'assets/img/icon16.png',
        32: 'assets/img/icon16@2x.png'
      }
    });

    clearTab(this.tab.id);
  },

  initialize: function initialize(port) {
    this.port = port;

    console.log('initialize - port:', port);

    // if (!this.alive) {
    // this.destroy();
    // return;
    // }

    this.port.onMessage.addListener(this.receiveBrowserMessageClosure);
    this.port.onDisconnect.addListener(this.onBrowserDisconnectClosure);

    this.port.postMessage({
      type: 'init',
      debug: debug
    });

    this.captureTab();
  },

  onBrowserDisconnect: function onBrowserDisconnect() {
    console.log('onBrowserDisconnect');
    this.destroy(true);
  },

  receiveBrowserMessageClosure: function receiveBrowserMessageClosure(event) {
    console.log('receiveBrowserMessageClosure', event);
  },

  receiveBrowserMessage: function receiveBrowserMessage(event) {
    switch (event.type) {
      case 'mousePos':
        this.worker.postMessage({
          type: 'mousePos',
          coord: event.coord
        });
        break;
      case 'color':
        console.log('receiveBrowserMessage color', event.data.data);
        this.port.postMessage({
          type: 'color',
          coord: event.data
        });
        break;
      case 'viewportChange':
        console.log('receiveBrowserMessage viewportChange', event.pageOffset);
        this.captureTab();
        break;
      case 'destroy':
        console.log('receiveBrowserMessage destroy');
        this.destroy();
        break;
    }
  },

  receiveWorkerMessage: function receiveWorkerMessage(event) {
    var forward = ['debug screen', 'color', 'screenshot processed', 'mousePos'];
    console.log('received worker message, forward to port :', event);

    if (forward.indexOf(event.data.type) > -1) {
      this.port.postMessage(event.data);
    }
  },

  captureTab: function captureTab() {
    chrome.tabs.captureVisibleTab({ format: "png" }, this.loadImage.bind(this));
  },

  loadImage: function loadImage(dataUrl) {
    this.image.onload = this.processCapture.bind(this);
    this.image.src = dataUrl;
  },

  processCapture: function processCapture() {
    this.context = this.canvas.getContext('2d');

    // adjust the canvas size to the image size
    this.canvas.width = this.tab.width;
    this.canvas.height = this.tab.height;

    // draw the image to the canvas
    this.context.drawImage(this.image, 0, 0, this.canvas.width, this.canvas.height);

    // store image data
    var imageData = this.context.getImageData(0, 0, this.canvas.width, this.canvas.height).data;
    this.sendImageData(imageData);
  },

  sendImageData: function sendImageData(imageData) {
    console.log('imageData :', imageData);
    // console.log('imageData.buffer :', imageData.buffer);

    this.worker.postMessage({
      type: 'imageData',
      imageData: imageData.buffer,
      width: this.canvas.width,
      height: this.canvas.height
    }, [imageData.buffer]);

    this.port.postMessage({
      type: 'imageData',
      imageData: this.image.src,
      width: this.canvas.width,
      height: this.canvas.height
    });
  }
};

/***/ })

/******/ });