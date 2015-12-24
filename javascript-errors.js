"use strict";

/**                                                                                                                                                                                 
 * @fileoverview This file contains all the functions used to test                                                                                                                  
 * JavaScript error behavior.                                                                                                                                                       
 */

var _useTryCatch = false;
var _oldSetTimeout;
var _oldPromiseThen;
var _worker;

function log(content, append) {
  if (append) {
    document.getElementById('console').textContent += content;
  } else {
    document.getElementById('console').textContent = content;
  }
}

function throwString() {
  throw "You shouldn't throw strings.";
}

function throwError() {
  throw new Error("Some error message");
}

/** This function exists just to add another stack frame. */
function throwErrorWrapper() {
  throwError();
}

function resetErrorHandlers() {
  document.getElementById('noerrorhandler').className = '';
  document.getElementById('windowonerror').className = '';
  document.getElementById('trycatch').className = '';
  document.getElementById('protectedentrypoint').className = '';
  window.onerror = undefined;
  _useTryCatch = false;
  if (_oldSetTimeout) {
    window.setTimeout = _oldSetTimeout;
  }
  if (_oldPromiseThen) {
    Promise.prototype.then = _oldPromiseThen;
  }
}

function useNoErrorHandler() {
  resetErrorHandlers();
  document.getElementById('noerrorhandler').className = 'active';
}

function useWindowOnError() {
  resetErrorHandlers();
  document.getElementById('windowonerror').className = 'active';
  window.onerror = function(msg, url, line, col, error) {
    var content = "" +
        "Message: " + msg + "\n" +
        "URL: " + url + "\n" +
        "Line: " + line + "\n" +
        "Column: " + col + "\n" +
        "Error: " + (!!error && error.stack);
    if (msg.indexOf('from worker') != -1) {
      log("\n\nError info from window.onerror:\n" + content, true);
    } else {
      log(content);
    }
  };
}

function useTryCatch() {
  resetErrorHandlers();
  document.getElementById('trycatch').className = 'active';
  _useTryCatch = true;
}

function protectEntryPoint(fn) {
  if (!fn) {
    return undefined;
  }
  var oldFn = fn;
  return function protectedFn() {
    try {
      return oldFn.apply(this, arguments);
    } catch (e) {
      log("Error object: " + e + "\nStack Trace: " + e.stack);
    }
  }
}

function useProtectedEntryPoints() {
  resetErrorHandlers();
  document.getElementById('protectedentrypoint').className = 'active';

  _oldSetTimeout = window.setTimeout;
  window.setTimeout = function protectedTimeout(fn, time) {
    return _oldSetTimeout.call(window, protectEntryPoint(fn), time);
  };
  _oldPromiseThen = Promise.prototype.then;
  Promise.prototype.then = function protectedThen(callback, errorHandler) {
    return _oldPromiseThen.call(this, protectEntryPoint(callback), protectEntryPoint(errorHandler));
  };
}
/** Catches any errors thrown by the given function. */
function catchError(fn) {
  try {
    fn();
  } catch (e) {
    log("Error object: " + e + "\nStack Trace: " + e.stack);
  }
}

/** Invokes the error function applying the appropriate error handling scheme. */
function invokeError(fn) {
  if (_useTryCatch) {
    catchError(fn);
  } else {
    fn();
  }
}

/** An example of an error thrown by the browser. */
function exampleErrorMessageTemplate() {
  var a = 3;
  a();
}

function throwAsyncError() {
  window.setTimeout(throwErrorWrapper, 10);
}

function throwNamedAnonymousFunction() {
  (function namedFunction() { throwError(); })();
}

function throwUnnamedAnonymousFunction() {
  (function() { throwError(); })();
}

function catchAndRethrow() {
  try {
    throwErrorWrapper();
  } catch (e) {
    throw e;
  }
}

function evalError() {
  eval("(function evaledFunction() { throw new Error('Error from eval'); })()");
}

function evalErrorWithSourceUrl() {
  eval("(function evaledFunction() { throw new Error('Error from eval'); })()\n//# sourceURL=eval.js");
}

function errorFromPromise() {
  var p = Promise.resolve(0);
  p.then(function(val) {
    return val++;
  }).then(function() {
    throw new Error("error from promise");
  });
}

function errorFromRejectedPromise() {
  var p = Promise.reject(new Error("rejected promise"));
  p.then(function(val) {
    return val++;
  });
}

function errorFromWorker() {
  // Clear out existing content so that both sources of errors from the worker are shown.
  log('');
  if (!_worker) {
    _worker = new Worker('worker.js');
    _worker.onerror = function(event) {
      var content = "\n\nError info from parent onerror:\n" +
          "Message: " + event.message + "\n" +
          "Filename: " + event.filename + "\n" +
          "Line: " + event.lineno + "\n" +
          "Column: " + event.colno + "\n" +
          "Error obj: " + event.error;
      log(content, true);
    };
    _worker.onmessage = handleWorkerMessage;
  }
  _worker.postMessage({ useTryCatch: _useTryCatch });
}

function handleWorkerMessage(event) {
  log(event.data, true);
}
