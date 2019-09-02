function hxlProxyToJSON(input){
    var output = [];
    var keys=[];
    input.forEach(function(e,i){
        if(i==0){
            e.forEach(function(e2,i2){
                var parts = e2.split('+');
                var key = parts[0];
                if(parts.length>1){
                    var atts = parts.splice(1,parts.length);
                    atts.sort();                    
                    atts.forEach(function(att){
                        key +='+'+att;
                    });
                }
                keys.push(key);
            });
        } else {
            var row = {};
            e.forEach(function(e2,i2){
                row[keys[i2]] = e2;
            });
            output.push(row);
        }
    });
    return output;
}

var ipcKeyDriversDataCall = $.ajax({
    type: 'GET',
    url: '',
    dataType: 'JSON',
});


$.when(ipcKeyDriversDataCall).then(function(ipcKeyDriversDataArgs){


    //display main
    $('.sp-circle').remove();
    $('main').removeClass('hidden');
});
