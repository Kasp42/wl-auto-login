// ==UserScript==
// @name         Wellnessliving AutoLogin
// @namespace    https://dev.1024.info/
// @version      1.8
// @description  Log in WL/prg with password from studio.
// @author       Vladislav Kobzev
// @match        *://*.wellnessliving.com/*
// @match        *://wellnessliving.com/*
// @match        *://wellnessliving.local/*
// @match        *://*.wellnessliving.local/*
// @match        *://dev.1024.info/*
// @match        *://wl.tr/*
// @match        *://wl.st/*
// @match        *://wl.pr/*
// @match        *://studio.trunk/*
// @grant        GM_deleteValue
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_xmlhttpRequest
// @downloadURL  https://raw.githubusercontent.com/Kasp42/wl-auto-login/master/wl-auto-login.user.js
// @updateURL    https://raw.githubusercontent.com/Kasp42/wl-auto-login/master/wl-auto-login.user.js
// ==/UserScript==

let S_LOGIN = ''; // You need set your login.

// TODO: Add suport incognito.
const S_COOKIE = ''; // You need set your cookie from studio.
let URL_PASSWORD = 'https://dev.1024.info/en-default//Studio/Personnel/Password.json';
let CSRF = GM_getValue('CSRF','');
let IS_PRG = false;
let IS_LOADING = false;

(function() {
  'use strict';

  // Grab CSFR code for send API request.
  if(window.location.host === 'dev.1024.info')
  {
    GM_setValue('CSRF',a_form_csrf_get('core-request-api'));
    return;
  }

  let jq_passport_login_form = document.getElementById('passport_login_form');
  if(!jq_passport_login_form)
  {
    jq_passport_login_form = document.getElementById('passport_login_small');
  }
  if(!jq_passport_login_form)
  {
    jq_passport_login_form = document.getElementById('wl-login-form-business');
  }

  if(!jq_passport_login_form)
  {
    jq_passport_login_form = document.getElementById('ProgLogin');
    IS_PRG = true;
  }
  if(!jq_passport_login_form)
  {
    jq_passport_login_form = document.getElementById('core-prg-login-form');
    IS_PRG = true;
  }

  if(jq_passport_login_form)
  {
    let jq_label, jq_label_login,jq_label_login_input,jq_label_password_input;
    if(!IS_PRG)
    {
      jq_label = jq_passport_login_form.getElementsByClassName('wl-login-form-label');

      jq_label_login = jq_label[0].getElementsByClassName('sign')[0];
      jq_label_login_input = jq_label[0].getElementsByClassName('type-text')[0];
      jq_label_password_input = jq_label[1].getElementsByClassName('type-text')[0];

      jq_label_login.innerHTML = jq_label_login.innerHTML+'&nbsp;&nbsp;(<span style="color: #6495ed;cursor:pointer;" id="wl-auto-login">Auto Login</span>)';
    }
    else
    {
      jq_passport_login_form = jq_passport_login_form.getElementsByTagName('table')[0].getElementsByTagName('input');

      jq_label_login_input = jq_passport_login_form[0];
      jq_label_password_input = jq_passport_login_form[1];
      jq_passport_login_form[2].outerHTML = jq_passport_login_form[2].outerHTML+'&nbsp;&nbsp;(<span style="color: #6495ed;cursor:pointer;font-size: larger;" id="wl-auto-login">Auto Login</span>)';
    }

    let jq_auto_login = document.getElementById('wl-auto-login');
    if(jq_auto_login)
    {
      jq_auto_login.onclick = function()
      {
        if(!S_LOGIN)
        {
          S_LOGIN = GM_getValue('S_LOGIN');
          if(!S_LOGIN)
          {
            return alert('You need set you login in script.');
          }
        }
        if(!CSRF)
        {
          return alert('CSRF code is empty. Please visit studio and reload page for grab CSRF code and after reload this page.');
        }
        if(IS_LOADING)
        {
          return false;
        }
        IS_LOADING = true;

        let s_password = a_password(24);
        let s_data = a_url_variable('',{
          's_password': s_password,
          'csrf': CSRF
        }).slice(1);

        GM_xmlhttpRequest({
          'method': 'PUT',
          'data': s_data,
          'headers': {
            'Cookie': S_COOKIE
          },
          'url': URL_PASSWORD,
          'onload': function(response)
          {
            IS_LOADING = false;
            if(response.readyState == 4 && response.status == 200)
            {
              var a_result = JSON.parse(response.responseText);
              if(a_result.status === 'csrf')
              {
                CSRF = '';
                GM_setValue('CSRF','');
                return alert('CSRF code is empty. Please visit studio and reload page for grab CSRF code and after reload this page.');
              }

              if(a_result.status !== 'ok')
              {
                return alert('Error setting password: '+a_result.message);
              }

              jq_label_login_input.value = S_LOGIN;
              jq_label_password_input.value = s_password;
              IS_LOADING = false;
              GM_setValue('S_LOGIN',S_LOGIN);
              if(IS_PRG)
              {
                jq_passport_login_form[2].click();
              }
              else
              {
                jq_passport_login_form.getElementsByClassName('wl-login-form-button')[0].click();
              }
            }
            else
            {
              console.debug(response);
              return alert('Error setting password. Status: '+response.status);
            }
          }
        });
      };
    }
  }
})();

function a_url_encode(s_name, x_value) {
  var s_name_encode = encodeURIComponent(s_name);

  if (x_value === true)
  {
    return s_name_encode + '=1';
  }
  if (x_value === false)
  {
    return s_name_encode + '=0';
  }

  var s_type = typeof (x_value);

  if (s_type === 'number')
  {
    return s_name_encode + '=' + x_value.toString();
  }
  if (s_type === 'string')
  {
    return s_name_encode + '=' + encodeURIComponent(x_value);
  }

  if (s_type !== 'object')
  {
    return s_name_encode;
  }

  var a_result = [];
  var i;
  var x_element;
  var s_key;

  var is_index = x_value instanceof Array;

  for (s_key in x_value) {
    if (!x_value.hasOwnProperty(s_key))
    {
      continue;
    }

    x_element = a_url_encode(s_name + '[' + (is_index ? '' : s_key) + ']', x_value[s_key]);
    if (typeof (x_element) === 'string')
    {
      a_result.push(x_element);
    }
    else {
      for (i = 0; i < x_element.length; i++)
      {
        a_result.push(x_element[i]);
      }
    }
  }
  return a_result;
}

function a_url_variable(url_source, a_change) {
  var i_fragment = url_source.lastIndexOf('#');
  var i_query = url_source.indexOf('?');
  var s_variable;
  var a_new = {};

  for (s_variable in a_change) {
    if (!a_change.hasOwnProperty(s_variable))
    {
      continue;
    }

    var x_value = a_change[s_variable];
    if (x_value !== false && x_value !== null && x_value !== undefined)
    {
      a_new[encodeURIComponent(s_variable)] = a_url_encode(s_variable, a_change[s_variable]);
    }
  }

  if (i_query >= 0) {
    var s_query = url_source.substr(i_query + 1, (i_fragment < 0 ? url_source.length : i_fragment) - i_query - 1);
    if (s_query.length) {
      var a_pair = s_query.split('&');
      for (var i_pair in a_pair) {
        if (!a_pair.hasOwnProperty(i_pair))
        {
          continue;
        }

        var a_pair_item = a_pair[i_pair].split('=', 2);
        a_pair_item = a_pair_item[0].split('[', 2);
        a_pair_item = a_pair_item[0].split('%5B', 2);

        var s_name_variable = a_pair_item[0];

        if (!a_change.hasOwnProperty(s_name_variable))
        {
          if (s_name_variable.indexOf('a_') > -1)
          {
            if (!a_new.hasOwnProperty(s_name_variable))
            {
              a_new[s_name_variable] = [];
            }

            a_new[s_name_variable].push(a_pair[i_pair]);
          }
          else
          {
            a_new[s_name_variable] = a_pair[i_pair];
          }
        }
      }
    }
  }

  var a_query = [];
  for (s_variable in a_new)
  {
    if (!a_new.hasOwnProperty(s_variable))
    {
      continue;
    }

    var x_variable = a_new[s_variable];

    if (typeof (x_variable) === 'string')
    {
      a_query.push(x_variable);
    }
    else
    {
      for (var s_key in x_variable)
      {
        if (x_variable.hasOwnProperty(s_key))
        {
          a_query.push(x_variable[s_key]);
        }
      }
    }
  }

  var url_result = url_source.substr(0, i_query >= 0 ? i_query : (i_fragment >= 0 ? i_fragment : url_source.length));
  if (a_query.length)
  {
    url_result += '?' + a_query.join('&');
  }
  if (i_fragment >= 0)
  {
    url_result += url_source.substr(i_fragment);
  }

  return url_result;
}

function a_password(i_length) {
  var s_symbols = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890";

  var r = '';
  for (var i = 0; i < i_length; i++)
  {
    var c = Math.round((Math.random() * 10000000)) % s_symbols.length;
    r = r + s_symbols.charAt(c);
  }
  return r;
}
