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
var shortenNumFormat = d3.format('.2s');
var numFormat = d3.format(',.0f');

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
  $('.num-usd').text(shortenNumFormat(usd));

  //households
  var households = d3.sum(cvaData.map(d=>d['#reached']));
  $('.num-households').text(shortenNumFormat(households));

  //orgs
  var orgs = d3.nest()
    .key(function(d) { return d['#org']; })
    .entries(cvaData);
  $('.num-org').text(orgs.length);
}


function sortTable(id){
  var data = tableData;
  data.sort(function(a, b){
    var x = (id>1) ? parseInt(a[id].replace(/[,$]/g,"")) : a[id];
    var y = (id>1) ? parseInt(b[id].replace(/[,$]/g,"")) : b[id];
    if (x < y) { return (headerAscending[id]) ? -1 : 1; }
    if (x > y) { return (headerAscending[id]) ? 1 : -1; }
    return 0;
  });
  return data;
}


var table;
var tableData = [];
var tableHeaders = ['Adm1', 'Country', 'Reached', 'Amount'];
var headerAscending = [true, false, false, false];
function createTable(){
  //get values by adm1
  var tableGroups = d3.nest()
    .key(function(d){ return d['#adm1+name']; })
    .rollup(function(v){ 
      return {
        country: v[0]['#country+name'],
        reached: d3.sum(v, function(d) { return d['#reached']; }),
        amount: d3.sum(v, function(d) { return d['#value+usd']; })
      };
    })
    .entries(cvaData);

  //flatten data
  tableGroups.forEach(function(d){
    tableData.push([d.key, d.value.country, numFormat(d.value.reached), '$'+numFormat(d.value.amount)]);
  });

  tableData = sortTable(0);

  table = d3.select('.chart-table').append('table');
  var header = table.append('thead').append('tr');
  header
    .selectAll('th')
    .data(tableHeaders)
    .enter()
      .append('th')
      .html(function(d) { return d + '<i class="fas fa-sort"></i>'; })
      .on('click', function(d){
        var index = 0;
        tableHeaders.forEach(function(header, i){
          if (header==d) {
            index = i;
            headerAscending.forEach(function(d, j) {
              headerAscending[j] = (j==i) ? !headerAscending[j] : false;
            });
          }
        });
        table.selectAll('tbody').remove();
        tableData = sortTable(index);
        drawTableRows();
      });

  drawTableRows();
}

function drawTableRows(){
  var tbody = table.append('tbody');
  var rows = tbody
    .selectAll('tr')
    .data(tableData)
    .enter()
      .append('tr');
  
  var cells = rows.selectAll('td')
    .data(function(d) {
      return d;
    })
    .enter()
      .append('td')
      .text(function(d) {
        return d;
      });
}

function styleMap (feature) {
  return {
    fillColor: '#CD2027',
    weight: 0.9,
    opacity: 0.6,
    color: 'black',
    fillOpacity: 0.6
  }
}

function generateMap (argument) {
  var map = L.map('map',
    { maxZoom: 19,
      minZoom: 2
    });
  map.setView([5.69, 10.26], 4);
  L.tileLayer('http://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
    {
      attribution: '&copy; <a href="http://www.openstreetmap.org/'+
                    +'copyright">OpenStreetMap</a>, Tiles courtesy of <a href="http://hot.openstreetmap.org/"'
                    +'target="_blank">Humanitarian OpenStreetMap Team</a>'
    }).addTo(map);

  L.geoJson(adm1,
    {
      style: styleMap
    }).addTo(map);
}

function genDropdowns (nom, filter) {
  let name = nom.charAt(0).toUpperCase() + nom.substring(1);
  let dropdwn = '<h4>'+name+'</h4><select class="dropdwn" id="'+name+'">';
  for (var i = 0; i < filter.length; i++) {
    i==0 ? dropdwn += '<option value="'+filter[i]+'" selected >'+filter[i]+'</option>' :
    dropdwn += '<option value="'+filter[i]+'">'+filter[i]+'</option>';
  }
  dropdwn +='</select>';
  $('#selections').append(dropdwn);

}

function getData() {
  Promise.all([
    d3.json(dataURL)
  ]).then(function(data){
    cvaData = data[0];
    let sectors = [],
        conditionalities = [],
        modalities = [],
        countries = [];
    let filters = ['#sector', '#indicator+modality', '#indicator+conditionality', '#country+name'];
    for (i in filters){
      let values = d3.nest()
          .key(function(d){ return d[filters[i]]; })
          .entries(cvaData);
      let keys = ['All values selected'];
      values.forEach(function(d){
        keys.includes(d.key) ? '' : keys.push(d.key);
      });
      filters[i] == '#sector' ? sectors = keys :
      filters[i] == '#indicator+modality' ? modalities = keys :
      filters[i] == '#indicator+conditionality' ? conditionalities = keys :
      filters[i] == '#country+name' ? countries = keys : '';
    }
    genDropdowns('country', countries);
    genDropdowns('modality', modalities);
    genDropdowns('conditionality', conditionalities);
    genDropdowns('sectors', sectors);
    createPieChart();
    createBarChart('sector');
    createBarChart('org');
    createKeyFigures();
    createTable();
    generateMap()
    //remove loader and show vis
    $('.loader').remove();
    $('main').removeClass('hidden');
  });
}