var receipt_json = function(receipt) {
  if (receipt.indexOf('~') > -1) {
    receipt = receipt.split('~')[1];
  }
  receipt = receipt.split('.')[1];
  return JSON.parse(atob(receipt));
};


var sample_receipt = 'eyJhbGciOiAiSFMyNTYiLCAidHlwIjogIkpXVCJ9.eyJwcm9kdWN0IjogeyJ1cmwiOiAiaHR0cHM6Ly93d3cubW96aWxsYS5vcmciLCAic3RvcmVkYXRhIjogIjUxNjkzMTQzNTYifSwgInJlaXNzdWUiOiAiaHR0cDovL21vY2hpLnRlc3Q6ODg4OC9yZWlzc3VlLzUxNjkzMTQzNTYiLCAidXNlciI6IHsidHlwZSI6ICJkaXJlY3RlZC1pZGVudGlmaWVyIiwgInZhbHVlIjogIjRmYjM1MTUxLTJiOWItNGJhMi04MjgzLWM0OWQzODE2NDBiZCJ9LCAidmVyaWZ5IjogImh0dHA6Ly9tb2NoaS50ZXN0Ojg4ODgvdmVyaWZ5LzUxNjkzMTQzNTYiLCAiaXNzIjogImh0dHA6Ly9tb2NoaS50ZXN0Ojg4ODgiLCAiaWF0IjogMTMxMzYwMTg4LCAidHlwIjogInB1cmNoYXNlLXJlY2VpcHQiLCAibmJmIjogMTMxMzYwMTg1LCAiZGV0YWlsIjogImh0dHA6Ly9tb2NoaS50ZXN0Ojg4ODgvcmVjZWlwdC81MTY5MzE0MzU2In0.eZpTEnCLUR3iP3rm9WyJOqx1k66mQaAxqcrvX11r5E0';


var install = function(ev) {
  var manifest_url = "http://localhost:9123/manifest.webapp";
  navigator.mozApps.install(manifest_url);
  ev.preventDefault();
};


var message = function(message) {
  var msg = $('#receipt-message');
  msg.classList.remove('hidden');
  msg.innerHTML = message;
  window.setTimeout(hide_message, 2000);
};

var hide_message = function() {
  var msg = $('#receipt-message');
  msg.classList.add('hidden');
};


var add = function(ev) {
  $.ajax({
    type: 'POST',
    url: 'https://marketplace.firefox.com/api/v1/receipts/test/',
    dataType: 'json',
    data: {'manifest_url': 'http://test-add.app/',
           'receipt_type': 'ok'}
  }).done(function(data) {
    var apps = window.navigator.mozApps.getSelf();
    apps.onsuccess = function(o) {
      var res = apps.result.addReceipt(data.receipt);
      res.onerror = function(o) {
        console.log('[receipt] reason: ' + this.error.name);
        message('Adding receipt failed, ' + this.error.name);
      };
      res.onsuccess = function(o) {
        console.log('[receipt] adding receipt succeeded');
        list(null);
      };
    };
  }).fail(function() {
    console.log('[receipt] get failed');
    message('Getting receipt failed');
  });


  ev.preventDefault();
};

var remove = function(ev) {
  var apps = window.navigator.mozApps.getSelf();
  var existing = this.dataset.receipt;

  apps.onsuccess = function(o) {
    console.log('[receipt] existing:' + existing);
    var res = apps.result.removeReceipt(existing);
    res.onerror = function(o) {
      console.log('[receipt] reason: ' + this.error.name);
      message('Removing receipt failed, ' + this.error.name);
    };
    res.onsuccess = function(o) {
      console.log('[receipt] removing receipt succeeded');
      list(null);
    };
  };

  ev.preventDefault();
};


var replace = function(ev) {
  console.log('[receipt] replace');
  var existing = this.dataset.receipt;

  $.ajax({
    type: 'POST',
    url: 'https://marketplace.firefox.com/api/v1/receipts/test/',
    dataType: 'json',
    data: {'manifest_url': 'http://test-replace.app/',
           'receipt_type': 'ok'}
  }).done(function(data) {
    console.log('[receipt] got it');
    var apps = window.navigator.mozApps.getSelf();
    apps.onsuccess = function(o) {
      var res = apps.result.replaceReceipt(existing, data.receipt);
      res.onerror = function(o) {
        console.log('[receipt] reason: ' + this.error.name);
        message('Removing receipt failed, ' + this.error.name);
      };
      res.onsuccess = function(o) {
        console.log('[receipt] removing receipt succeeded');
        list(null);
      };
    };
  }).fail(function() {
    console.log('[receipt] get failed');
    message('Getting receipt failed');
  });

  ev.preventDefault();
};


var list = function() {
  var dest = document.getElementById('receipt-list');
  dest.innerHTML = '';

  var apps = window.navigator.mozApps.getSelf();
    if (apps.result === null) {
      return;
    }

    apps.onerror = function(o) {
      console.log('[receipt] error occurred in getting receipts');
    };

    apps.onsuccess = function(o) {
      console.log('[receipt] onsuccess');
      if (apps.result !== null) {
        console.log('[receipt] ' + apps.result.receipts.length);
        // No receipts, show a nice friendly message.
        if (apps.result.receipts.length === 0) {
          dest.appendChild(document.createElement('p'));
          var p = dest.querySelector('p:last-child');
          p.classList.add('well');
          p.innerHTML = 'No receipts.';
        }

        // Show the receipts.
        for (var k = 0; k < apps.result.receipts.length; k++) {
          var receipt = apps.result.receipts[k];
          console.log(receipt);
          var rc = receipt_json(receipt);
          dest.appendChild(document.createElement('p'));
          var p = dest.querySelector('p:last-child');
          p.classList.add('well');
          p.innerHTML =
            '<b>Status:</b> <span class="label label-warning">Unknown status</span><br>' +
            '<b>Type:</b> ' + rc.typ + '<br>' +
            '<b>URL:</b> ' + rc.product.url + '<br><br>' +
            '<button class="btn btn-danger remove" data-receipt="' + receipt + '">Uninstall</button> ' +
            '<button class="btn btn-warning replace" data-receipt="' + receipt + '">Replace</button>';
        };

        $('.remove').on('click', remove);
        $('.replace').on('click', replace);
      };
    };
};

$(document).ready(function() {
  var apps = window.navigator.mozApps.getSelf();
  apps.onsuccess = function(o) {
    if (apps.result === null) {
      $('#install').removeClass('hidden');
      $('#install button').on('click', install)
    } else {
      $('#add').on('click', add).removeClass('hidden');
      list();
    }
  }
});
