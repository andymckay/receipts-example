var receipt_json = function(receipt) {
  if (receipt.indexOf('~') > -1) {
    receipt = receipt.split('~')[1];
  }
  receipt = receipt.split('.')[1];
  return JSON.parse(atob(receipt));
};


var install = function(ev) {
  var manifest_url = window.location.href + 'manifest.webapp';
  navigator.mozApps.install(manifest_url);
  ev.preventDefault();
};


var message = function(message) {
  var msg = $('#receipt-message');
  msg.removeClass('hidden');
  msg.html(message);
  window.setTimeout(hide_message, 2000);
};


var hide_message = function() {
  var msg = $('#receipt-message');
  msg.addClass('hidden');
};


var add = function(ev) {
  var type = this.dataset.type;
  console.log('[receipt] add: ' + type);
  $.ajax({
    type: 'POST',
    url: 'https://marketplace.firefox.com/api/v1/receipts/test/',
    dataType: 'json',
    data: {'manifest_url': 'http://test.app/',
           'receipt_type': type}
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
    data: {'manifest_url': 'http://test.app/',
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
          var rc = receipt_json(receipt);
          dest.appendChild(document.createElement('p'));
          var p = dest.querySelector('p:last-child');
          p.classList.add('well');
          p.innerHTML =
            '<b>Type:</b> ' + rc.typ + '<br>' +
            '<b>URL:</b> ' + rc.product.url + '<br>' +
            '<b>Verify:</b> ..' + rc.verify.split('receipts').pop() + '<br><br>' +
            '<button class="btn btn-danger remove" data-receipt="' + receipt + '">Uninstall</button> ' +
            '<button class="btn btn-warning replace" data-receipt="' + receipt + '">Replace</button>';
        };

        $('.remove').on('click', remove);
        $('.replace').on('click', replace);
      };
    };
};


var verify = function() {
  var verifier = new mozmarket.receipts.Verifier({
    // Because we are using the API which only returns test-receipts
    // we have to explicitly allow this.
    typsAllowed: ['test-receipt']
  });
  message('Verifying receipts.');
  verifier.clearCache();
  console.log('[receipt] clearing cache');
  verifier.verify(function(verifier) {
    if (verifier.state instanceof verifier.states.OK) {
      message('Receipts verified.');
    } else {
      message('<b>Failed:</b> ' + verifier.state.detail);
    };
  });
};


$(document).ready(function() {
  var apps = window.navigator.mozApps.getSelf();
  apps.onsuccess = function(o) {
    if (apps.result === null) {
      $('#install').removeClass('hidden');
      $('#install button').on('click', install)
    } else {
      $('#receipt-add').removeClass('hidden');
      $('.add').on('click', add);
      $('#verify').on('click', verify);
      list();
    }
  }
});
