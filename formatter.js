$('#reformat').change(function() {
  // disable resolve aliases if reformat is not checked
  $('#resolve_aliases').prop('disabled', !$('#reformat').is(':checked'));
  $('#reformat').is(':checked') ?  $('#resolve_aliases_label').removeClass('disabled') : $('#resolve_aliases_label').addClass('disabled');
})

function yamlChanged() {
  $('#result').css('background-color', '').text('');
  return;
}

function selectLines(arr) {
    $(".codelines .lineno.lineselect").removeClass("lineselect")
    if (arr.length < 1 || arr[0] < 1) return false;
    for(const line of arr) {
      $(".codelines .lineno").eq(line -1).addClass("lineselect");
    }
}

function getErrors(doc) {
  var lines = [];
  var messages = [];

  if (doc.errors.length > 0) {
    error_line = doc.errors[0].linePos[0].line;
    error_msg = doc.errors[0].message.split(':\n')[0]

    doc.errors.forEach((e, i) => {
      messages.push(e.message.split(':\n')[0]);
      lines.push(e.linePos[0].line);
    });
  }
  return [lines, messages];
}

var YAML = require('yaml');
var x;
function parseYaml(){
  var reformat        = $('#reformat').is(':checked');
  var resolve_aliases = $('#resolve_aliases').is(':checked');
  var lines           = [];
  var messages        = [];  
  
  // check for input
  if ($('#yaml').val().length <= 0) {
    $('#result').css('background-color', '').text('');
    return;
  }

  // check for multiple documents
  x = YAML.parseDocument($('#yaml').val(),{'merge' : true});
  if (x.errors.length > 0 && x.errors.some((e) => e.code == 'MULTIPLE_DOCS')) {
    var arr = YAML.parseAllDocuments($('#yaml').val(), {'merge' : true});

    for (const doc of arr) {
      var e = getErrors(doc);
      lines = lines.concat(e[0]);
      messages = messages.concat(e[1]);
    }
    selectLines(lines);
    if (lines.length != 0) {
       $('#result').css('background-color', 'red').html('Multiple documents detected - '+ messages.join('<br/>'));
    } else {
      $('#result').css('background-color', 'green').text('Multiple documents detected - Valid YAML!');
      if ($('#reformat').is(':checked')) {
        var docStrings = arr.map(function(x) { return YAML.stringify(x.toJS(), {'aliasDuplicateObjects' : !resolve_aliases, 'directives' : true }); });
        $('#yaml').val(docStrings.join("\n"));
      }
    }
  } else {
    var e = getErrors(x);
    lines = lines.concat(e[0]);
    messages = messages.concat(e[1]);
    selectLines(lines);
    if (lines.length > 0) {
      $('#result').css('background-color', 'red').html(messages.join('<br/>'));
    } else {
      if ($('#yaml').val().length > 0) {
        $('#result').css('background-color', 'green').text('Valid YAML!');
        if ($('#reformat').is(':checked')) {
          var t = YAML.stringify(x.toJS(),{'aliasDuplicateObjects' : !resolve_aliases, 'directives' : true });
          $('#yaml').val(t);
        }
        if ($('#enableIast').is(':checked')) {
            console.log("Enabling IAST")
            console.log(x)
            x.addIn(['common','security','enabled'], true)
            x.addIn(['common','security','mode'], 'IAST')
            x.addIn(['common','security','validator_service_url'], 'wss://csec.nr-data.net')
            x.addIn(['common','security','agent','enabled'], true)
            x.addIn(['common','security','detection','rci','enabled'], true)
            x.addIn(['common','security','detection','rxss','enabled'], true)
            x.addIn(['common','security','detection','deserialization','enabled'], true)
            console.log("Done enabling IAST")
            var t = YAML.stringify(x);
          $('#yaml').val(t);
        }
      }
    }
  }
}

$(function() {
  // Target all classed with ".lined"
  $(".lined").linedtextarea(
     {selectedLine: null}
  );
});