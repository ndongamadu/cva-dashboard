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


var dataURL = 'https://proxy.hxlstandard.org/data.objects.json?url=https%3A%2F%2Fdocs.google.com%2Fspreadsheets%2Fd%2F1PDflSEez41f-509wTh_Ss5DTk4XO36z1CLltU_uv-nI%2Fedit%23gid%3D0';
var cvaData = '';

getData();


function createPieChart(){
  var modalityData = d3.nest()
    .key(function(d){ return d['#indicator+modality']; })
    .rollup(function(leaves){  return leaves.length; })
    .entries(cvaData);

  modalityArray = [];
  modalityData.forEach(function(d){
    if (d.key!=""){
      modalityArray.push([d.key, d.value]);
    }
  });

  var amountChart = c3.generate({
    bindto: '.chart-amount',
    data: {
      columns: modalityArray,
      type : 'donut',
      colors: { 
        Cash: '#CD2027',
        Vouchers: '#F9EBD1',
        Mixed: '#D2D2D2'
      }
    }
  });
}

function createBarChart(id){
  //get values by tag
  var graphData = d3.nest()
    .key(function(d){ return d['#'+id]; })
    .rollup(function(leaves){ return leaves.length; })
    .entries(cvaData);

  //sort data in descending order
  graphData.sort((a, b) => (a.value < b.value) ? 1 : -1)

  //format data for bar chart
  categoryArray = ['x'];
  graphArray = ['Value'];
  graphData.forEach(function(d){
    categoryArray.push(d.key);
    graphArray.push(d.value);
  });

  //get max value
  var maxY = d3.max(graphData.map(d=>d.value));
  maxY = Math.ceil(maxY/100)*100;

  //create chart
  var chart = c3.generate({
    bindto: '.chart-'+id,
    data: {
      x: 'x',
      columns: [categoryArray, graphArray],
      type: 'bar',
      colors: { Value: '#CD2027' }
    },
    axis: {
      rotated: true,
      x: { type: 'category' },
      y: {
        max: maxY,
        min: 0,
        padding: {top: 0, bottom: 0},
        tick: { count: 3 }
      }
    },
    grid: {
      y: { show: true  }
    },
    legend: { show: false  }
  });
}

function createKeyFigures(){
  //usd
  var usd = d3.sum(cvaData.map(d=>d['#value+usd']));
  $('.num-usd').text(d3.format("(.2s")(usd));

  //households
  var households = d3.sum(cvaData.map(d=>d['#reached']));
  $('.num-households').text(d3.format(".2s")(households));

  //orgs
  var orgs = d3.nest()
    .key(function(d) { return d['#org']; })
    .entries(cvaData);
  $('.num-org').text(orgs.length);
}


function getData() {
  Promise.all([
    d3.json(dataURL)
  ]).then(function(data){
    cvaData = data[0];

    createPieChart();
    createBarChart('sector');
    createBarChart('org');
    createKeyFigures();
    
    //remove loader and show vis
    $('.loader').remove();
    $('main').removeClass('hidden');
  });
}