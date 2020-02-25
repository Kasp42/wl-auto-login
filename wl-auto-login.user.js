// ==UserScript==
// @name         Wellnessliving AutoLogin
// @namespace    https://dev.1024.info/
// @version      2.5
// @description  Log in WL/prg with password from studio.
// @author       Vladislav Kobzev
// @icon         https://www.wellnessliving.com/favicon-wl.ico
// @match        *://*.wellnessliving.com/*
// @match        *://wellnessliving.com/*
// @match        *://wellnessliving.local/*
// @match        *://*.wellnessliving.local/*
// @match        *://dev.1024.info/*
// @match        *://wl.tr/*
// @match        *://wl.st/*
// @match        *://wl.pr/*
// @match        *://studio.tr/*
// @grant        GM_deleteValue
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_xmlhttpRequest
// @grant        unsafeWindow
// @downloadURL  https://raw.githubusercontent.com/Kasp42/wl-auto-login/master/wl-auto-login.user.js
// @updateURL    https://raw.githubusercontent.com/Kasp42/wl-auto-login/master/wl-auto-login.user.js
// ==/UserScript==

let S_LOGIN = ''; // You need set your login.

const S_COOKIE = ''; // You need set your cookie from studio for login in incognito mode.
let URL_PASSWORD = 'https://dev.1024.info/en-default/Studio/Personnel/Password.json';
let CSRF = GM_getValue('CSRF','');
let IS_PRG = false;
let IS_LOADING = false;
let IS_AUTO_LOGIN_PRG = true;
let PRG_LOGIN = GM_getValue('PRG_LOGIN','');
let PRG_PASSWORD = GM_getValue('PRG_PASSWORD','');
const IS_LOCAL_SITE = [
  'wl.tr',
  'wl.st',
  'wl.pr',
  'studio.tr',
  'wellnessliving.local',
  'stable.wellnessliving.local'
].indexOf(window.location.host) >= 0;

let BUTTON_TEMPLATE_WL = '<input id="wl-auto-login" type="button" value="Auto Login" class="button-next wl-login-form-button">';
let BUTTON_TEMPLATE_PRG = '&nbsp;&nbsp;(<span style="color: #6495ed;cursor: pointer;font-size: larger;" id="wl-auto-login">Auto Login</span>)';

(function() {
  'use strict';

  // Need set value for display in Storage tab.
  if(!PRG_LOGIN)
  {
    GM_setValue('PRG_LOGIN','');
  }
  if(!PRG_PASSWORD)
  {
    GM_setValue('PRG_PASSWORD','');
  }

  // Grab CSFR code for send API request.
  if(window.location.host === 'dev.1024.info')
  {
    GM_setValue('CSRF',unsafeWindow.a_form_csrf_get('core-request-api'));
    return;
  }

  var $ = unsafeWindow.jQuery;

  if($ === undefined)
  {
    console.warn('For using Auto Login need include jQuery in page.');
    return;
  }

  let jq_passport_login_form = $('#passport_login_small');
  if(!jq_passport_login_form.length)
  {
    jq_passport_login_form = $('#wl-login-form-business');
  }
  if(!jq_passport_login_form.length)
  {
    jq_passport_login_form = $('#core-prg-login-form');
    IS_PRG = true;
  }

  if(jq_passport_login_form.length)
  {
    let jq_label_login_input,jq_label_password_input;
    let jq_button_login = jq_passport_login_form.find('[type="submit"]');
    if(!IS_PRG)
    {
      jq_label_login_input = jq_passport_login_form.find('[name="login"]');
      jq_label_password_input = jq_passport_login_form.find('[name="pwd"]');
      jq_button_login.after(BUTTON_TEMPLATE_WL);
    }
    else
    {
      jq_label_login_input = jq_passport_login_form.find('[name="s_login"]');
      jq_label_password_input = jq_passport_login_form.find('[name="s_password"]');
      jq_button_login.after(BUTTON_TEMPLATE_PRG);
    }

    let jq_auto_login = $('#wl-auto-login');
    if(!jq_auto_login.length)
    {
      console.warn('Auto Login button does not exist.');
      return;
    }

    jq_auto_login.click(function()
      {
        if(
          IS_LOCAL_SITE &&
          IS_PRG &&
          PRG_LOGIN &&
          PRG_PASSWORD
        )
        {
          jq_label_login_input.val(PRG_LOGIN);
          jq_label_password_input.val(PRG_PASSWORD);
          jq_button_login.click();

          return;
        }

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

              jq_label_login_input.val(S_LOGIN);
              jq_label_password_input.val(s_password);
              IS_LOADING = false;
              GM_setValue('S_LOGIN',S_LOGIN);
              jq_button_login.click();
            }
            else
            {
              console.debug(response);
              return alert('Error setting password. Status: '+response.status);
            }
          }
        });
      });

      if(IS_PRG && IS_AUTO_LOGIN_PRG)
      {
        if(typeof Core_Debug_ErrorList === 'function' && Core_Debug_ErrorList.a_error_list.length > 0)
        {
          alert('Auto login is not working if javascript on page is not compiled or compiled with error.');
          return;
        }
        jq_auto_login.click();
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
