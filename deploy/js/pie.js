window.onload = init;

var chartColor = "#268892";
var bgColor =  "#E8E8E8";
var xhr = false;
var statesArray = new Array();

var objectsArray;
var canvas = null;
var context = null;

var sliceCount=0;
var totalCount;
var slicesArray = new Array();
var centerX = 220;
var centerY = 200;
var radius = 130;
var textArray = new Array();
var bodyArray = new Array();
var toRedraw = false;
var toHighlight = false;
var hIndex;
var a = 0;
var txtOpac = 0;
var descWindowHeight = 0;
var firstReveal = true;
var highlightAlpha = 0;
var revealCount = 0;


function init() {

 
    if (window.XMLHttpRequest) {
		xhr = new XMLHttpRequest();
	}
	else {
		if (window.ActiveXObject) {
			try {
				xhr = new ActiveXObject("Microsoft.XMLHTTP");
			}
			catch (e) { }
		}
	}

	if (xhr) {
		xhr.onreadystatechange = setStatesArray;
		xhr.open("GET", "data/chartdata.txt", true);
		xhr.send(null);
	}
	else {
		alert("Sorry, but I couldn't create an XMLHttpRequest");
	}
}

function setStatesArray() {
	if (xhr.readyState == 4) {
		if (xhr.status == 200) {
			if (xhr) {
		   	   getData(xhr.responseText);
			}
		}
		else {
			alert("There was a problem with the request " + xhr.status);
		}
	}
}

function sendData(data) {
     var tempDiv = document.createElement("chartData");
     tempDiv.innerHTML = data;
     document.getElementById("chart").appendChild(tempDiv);          
}  

function getData(data) {

    var jsonObject = JSON.parse(data) 
    var dataObj = jsonObject[0];
    
    objectsArray = new Array();
   
    for (var pr in dataObj) {
        var prObject = new Object();
        prObject.name = dataObj[pr].name;
        prObject.numPeople = dataObj[pr].numPeople; 
        prObject.listOfPeople = dataObj[pr].listOfPeople;
        objectsArray.push(prObject);
       
     }
     
     if (objectsArray.length > 0) {
        convertDataToPercents(objectsArray);  
     }
     
}


function convertDataToPercents(objsArray) {
	
    var sum = 0;
			
	for (var i=0; i<objsArray.length; i++) {
				
		sum += Number(objsArray[i].numPeople);
				
	}
	
    if (sum > 0) {
		for (var j=0; j<objsArray.length; j++) {
			objsArray[j].percent = Number((objsArray[j].numPeople * 100)/sum);
		}
	} 			
	
    sortDataResult(objsArray);
    
}

function sortDataResult(objsArray) {
   
      objsArray.sort(function(a, b) {return b.percent - a.percent});
      
      drawChart(objsArray);
    
}

function drawChart(objsArray) {

     getChartStructure(objsArray);
 
     initializeStage();
    
}



function oncanvasclick(e) {

    if (e.layerX || e.layerX == 0) { // Firefox
    
        e._x = e.layerX;
        e._y = e.layerY;
        
    } else if (e.offsetX || e.offsetX == 0) { // Opera
    
        e._x = e.offsetX;
        e._y = e.offsetY;
    }
 
     var dx;
     var dy;
     var radians = 0;
     var dist;
     
     
     dx = (e._x - centerX);
     dy = (e._y - centerY);

     dist = Math.sqrt(dx * dx + dy * dy);
    
    
    if (dist > 60 && dist < 150) {
     
         if (dy > 0) {
             var tempR = Math.atan2(dy, dx); 
              radians = tempR;
         } else if (dy < 0)  {
             var tempR = Math.atan2(dy, dx) + 2* Math.PI;
             radians = tempR;  
         }

     
        for (var i=0 ; i<slicesArray.length; i++) {
           if((radians > slicesArray[i].sa) && (radians < slicesArray[i].ea)) {
               var currentIndex = slicesArray[i].index;
               addDescWindow(currentIndex);
           }
       }
    }
}

function oncanvasmove(e) {

    if (e.layerX || e.layerX == 0) { // Firefox
    
        e._x = e.layerX;
        e._y = e.layerY;
        
    } else if (e.offsetX || e.offsetX == 0) { // Opera
    
        e._x = e.offsetX;
        e._y = e.offsetY;
    }
 
     var dx;
     var dy;
     var radians = 0;
     var dist;
     
     
     dx = (e._x - centerX);
     dy = (e._y - centerY);

     dist = Math.sqrt(dx * dx + dy * dy);
    
    
    if (dist > 60 && dist < 150) {
     
         if (dy > 0) {
              var tempR = Math.atan2(dy, dx);
              radians = tempR;
         } else if (dy < 0)  {
             var tempR = Math.atan2(dy, dx) + 2* Math.PI;
             radians = tempR;  
         }
        
        toRedraw = true;
        toHighlight = true;
     
        for (var i=0 ; i<slicesArray.length; i++) {
           if((radians > slicesArray[i].sa) && (radians < slicesArray[i].ea)) {
               var currentIndex = slicesArray[i].index;
               hIndex = currentIndex;
               clearChartArea();
               chart();
           }
       }
    } else {
        toRedraw = false;
        toHighlight = false;
        clearChartArea();
        chart();
    }
}

function getChartStructure(objsArray) {

      totalCount = objsArray.length;
      var startPoint = 0;
      
      for (var i=0; i<objsArray.length; i++) {
          
          sliceCount = i;
           
          if (i > 0) {
               startPoint = getStartPoint(i, objectsArray);
               var slice = new Slice(i, startPoint, objectsArray[i].percent);
               slice.index = i;
               slicesArray.push(slice); 
              
          } else {
               var slice = new Slice(i, startPoint, objectsArray[i].percent);
               slice.index = i;
               slicesArray.push(slice);
           } 
      }
}

function initializeStage() {

      canvas = document.getElementById("chart");
      
      if (canvas && canvas.getContext) {
          context = canvas.getContext("2d");
      }
      
      context.beginPath();
      context.moveTo(centerX, centerY);
      
    
	
      canvas.onselectstart = function () { return false; }
      
     if (document.defaultView && document.defaultView.getComputedStyle) {
         stylePaddingLeft = parseInt(document.defaultView.getComputedStyle(canvas, null)['paddingLeft'], 10)      || 0;
         stylePaddingTop  = parseInt(document.defaultView.getComputedStyle(canvas, null)['paddingTop'], 10)       || 0;
         styleBorderLeft  = parseInt(document.defaultView.getComputedStyle(canvas, null)['borderLeftWidth'], 10)  || 0;
         styleBorderTop   = parseInt(document.defaultView.getComputedStyle(canvas, null)['borderTopWidth'], 10)   || 0;
      }

     startChart();
}

function clearChartArea() {
    context.clearRect(0,0,440,400);
}

function chart() {

    if (!toRedraw) {
       plainChart();
    } else {
       highlightedChart();
    }
}

function plainChart() {

     toHighlight = false;
     
     clearChartArea();
    
     addBottomLayer();
  
     addTopLayer();
     
     addCenterShape() ;
     
     chartNames();
     
   
}

function highlightedChart() {

     toHightLight = true;
     
     clearChartArea();
    
     addBottomLayer();
     
     addTopLayer();
     
     addCenterShape();
     
     chartNames();
     
  
}

function startChart() {
    
  
    setTimeout("drawOnTimer()", 50);

}

function drawOnTimer() {

     var max = 6.7;
     var tempArray = [];
    
     clearChartArea();
     
     if (a < max) {
  
         context.beginPath();
         context.fillStyle = bgColor;
         context.strokeStyle = bgColor;
         context.moveTo(centerX, centerY);
	     context.arc(centerX, centerY, radius+10, 0, a, false);
         context.fill();
         context.stroke();
     
       
         for (var i=0 ; i<slicesArray.length; i++) { 
            if ((a >= slicesArray[i].sa) && (a<slicesArray[i].ea)) {
                 tempArray = slicesArray.slice(0, i+1);
            }
         }
         
         if (tempArray.length > 0) {
             
             for (var j=0; j<tempArray.length; j++) {
                 
 
                if (tempArray[j].ea > a) {
                
                   context.beginPath();
                   context.fillStyle = tempArray[j].color;
                   context.strokeStyle=tempArray[j].color;
                   context.lineWitdh = 1;
                   context.moveTo(centerX, centerY);
                   context.arc(centerX, centerY, radius, tempArray[j].sa , a, false);
                   context.stroke();
                   context.fill();
                   context.closePath();
                     
                } else {
                
                    context.beginPath();
                    context.fillStyle = tempArray[j].color;
                    context.strokeStyle= tempArray[j].color;
                    context.lineWitdh = 1;
                    context.moveTo(centerX, centerY);
                    context.arc(centerX, centerY, radius, tempArray[j].sa, tempArray[j].ea, false);
                    context.stroke();
                    context.fill();
                    context.closePath();
                }
             }
            tempArray = [];
         }

        context.beginPath();
        context.fillStyle = bgColor;
        context.strokeStyle = bgColor;
        context.lineWidth = 0;
        context.moveTo(centerX, centerY);
	    context.arc(centerX, centerY, radius-58, 0, a, false);
        context.fill();
        context.stroke();
        
        context.beginPath();
        context.moveTo(centerX, centerY);
        context.strokeStyle = bgColor;
        context.lineWidth = 0.2;
        context.arc(centerX,centerY,radius-42,0,a,false);
        context.closePath();
        context.stroke();
         
        context.beginPath();
        context.moveTo(centerX, centerY);
        context.strokeStyle = bgColor;
        context.lineWidth = 0.2;
        context.arc(centerX,centerY,radius-15,0,a,false);
        context.closePath();
        context.stroke();
      
    
        context.beginPath();
        context.fillStyle = "#FFFFFF";
	    context.arc(centerX, centerY, radius-60, 0, Math.PI*2, false);
        context.fill();
      
         a += (max - a) * 0.1;
       
         
     } 
 
     if (a >= Math.PI*2) { tempArray = [];  setTimeout("revealDescInfo();", 100); } else {startChart()}
  
     
  }    
  
 
 
function revealDescInfo() {

      addDescWindow(0);
    
      setTimeout( "addMouseListeners()", 1000);
   
}

function addMouseListeners() {
    canvas.addEventListener('mousedown', oncanvasclick, false);
    canvas.addEventListener('mousemove', oncanvasmove, false);
}


function addBottomLayer() {

  if (!toHighlight) {
      drawSameBackground();
  } else {
      drawHighlightedBg();
  }
  
}



function drawSameBackground() {

   context.save(); 
   context.fillStyle = bgColor;
   context.strokeStyle =  bgColor;
   context.lineWidth = 1;

   for (var i=0; i<slicesArray.length; i++) {
    
       context.beginPath();
       context.moveTo(centerX, centerY);
       context.arc(centerX, centerY, radius+10, slicesArray[i].sa, slicesArray[i].ea, false);
       context.fill();
          
   }

   context.closePath();
   
  
  
}

function  drawHighlightedBg() {

   var color; 
   for (var i=0; i<slicesArray.length; i++) {
  
      if ( i == hIndex) {
          color = getNewColor(chartColor,slicesArray.length-3, 1);
          context.fillStyle = color ;
          
       } else {
          color = bgColor;
          context.fillStyle = bgColor;
       }
       context.beginPath();
       context.moveTo(centerX, centerY);
       context.arc(centerX, centerY, radius+10, slicesArray[i].sa, slicesArray[i].ea, false);
       context.fill();  
     
     }
   
   context.closePath();

    
}


function Slice(index,startPoint, percent) {
  
     var t = 2 * Math.PI ;

     var startAngle = ((startPoint) * 2 * Math.PI)/100;
     var endAngle = startAngle + ((percent * 2 * Math.PI)/100);
     
     this.index = index;
     this.sa = startAngle;
     this.ea = endAngle;
     this.color = getNewColor(chartColor, index,1);
    
}


function getStartPoint(count, array) {

    var point = 0;
	while (count > 0) {	
	    point = point + array[count-1].percent;
	    count--;
	}		
    return point;
}



function getNewColor(startColor, count, opac) {
     
    sliceCount = count; 
    var percent = getPercent(sliceCount);
          
    var startR = hexToRgb(startColor, 0, 2);
    var startG = hexToRgb(startColor, 2, 4);
    var startB = hexToRgb(startColor, 4, 6);
                     
    var endColor = '#E8E8E8';
          
    var endR = hexToRgb(endColor, 0, 2);
    var endG = hexToRgb(endColor, 2, 4);
    var endB = hexToRgb(endColor, 4, 6);
          
    var red = Math.floor((endR - startR)*percent + startR);
	var green = Math.floor((endG - startG)*percent + startG);
	var blue = Math.floor((endB - startB)*percent + startB);
	var alpha = opac;
        
	return 'rgba' + '(' + red + ',' + green + ',' + blue + ',' + alpha +')';
	
}


function getTranspColor(startColor, opac) {
 
          
    var red = hexToRgb(startColor, 0, 2);
	var green = hexToRgb(startColor, 2, 4)
	var blue = hexToRgb(startColor, 4, 6);
	var alpha = opac;
        
	return 'rgba' + '(' + red + ',' + green + ',' + blue + ',' + alpha +')';
	
}


function hexToRgb(color, st, end) {
    return parseInt((cutHex(color)).substring(st, end),16);
}


function cutHex(h) {
    return (h.charAt(0)=="#") ? h.substring(1,7):h
}



function getPercent(index) {
	return (index+1)/(totalCount+1);
}


function addTopLayer() {
 
   context.beginPath();
   
   for (var i=0; i<slicesArray.length; i++) {
   
      var arcColor =  getNewColor(chartColor, i, 1);
     
      
      context.fillStyle = arcColor;
      context.strokeStyle = arcColor;
      context.lineWidth = 1;
      
      context.beginPath();
     
      context.moveTo(centerX, centerY);
    
      context.arc(centerX, centerY, radius, slicesArray[i].sa, slicesArray[i].ea, false);
   
      context.closePath();
      context.stroke();
      context.fill();
   }

}


function  addCenterShape() {

      context.beginPath();
      context.fillStyle = bgColor;
      context.strokeStyle = bgColor;
      context.lineWidth = 0;
      context.moveTo(centerX, centerY);
	  context.arc(centerX, centerY, radius-58, 0, Math.PI*2, false);
      context.fill();
      context.stroke();
    
      context.strokeStyle = bgColor;
      context.lineWidth = 0.2;
      context.beginPath();
      context.arc(centerX,centerY,radius-42,0,Math.PI*2,true);
      context.closePath();
      context.stroke();
      
      context.strokeStyle = bgColor;
      context.lineWidth = 0.2;
      context.beginPath();
      context.arc(centerX,centerY,radius-15,0,Math.PI*2,true);
      context.closePath();
      context.stroke();
      
      context.beginPath();
      context.fillStyle = "#FFFFFF";
	  context.arc(centerX, centerY, radius-60, 0, Math.PI*2, false);
      context.fill();
  
}


function addDescWindow(index) {

    sliceIndex = index;
    
    txtOpac = 0;
    clearTextWindow(); 
   
    var totalListArray = objectsArray[sliceIndex].listOfPeople;
    
    if (totalListArray.length > 0) {
        descWindowHeight = (totalListArray.length +2) * 20;
    } else {
        descWindowHeight = 35;
    }
    
    fadeInDesc(); 
    
}




function fadeInDesc() {
     
     setTimeout("fadeIn()", 50);
   
}

function fadeIn() {

     
   
     if (txtOpac < 1) {
    
        txtOpac+=0.1; 
       
        clearTextWindow(); 
       
        addNames(txtOpac);
  
        roundedRect(context, 445, 50, 180, descWindowHeight, 5, txtOpac);
      
        addText(sliceIndex, txtOpac); 
        
        if (firstReveal == true) {
           addNames(txtOpac);
         }
       
      } 
   
}


function clearTextWindow() {

	context.clearRect(440, 0, 300, 400);
	context.beginPath();
	
}



function roundedRect(context,x,y,width,height,radius, opac){
      
      context.fillStyle = getTranspColor('#E8E8E8', opac);
	  context.beginPath();
	  context.moveTo(x,y+radius);
	  context.lineTo(x,y+height-radius);
	  context.quadraticCurveTo(x,y+height,x+radius,y+height);
      context.lineTo(x+width-radius,y+height);
	  context.quadraticCurveTo(x+width,y+height,x+width,y+height-radius);
      context.lineTo(x+width,y+radius);
	  context.quadraticCurveTo(x+width,y,x+width-radius,y);
	  context.lineTo(x+radius,y);
      context.quadraticCurveTo(x,y,x,y+radius);
      context.fill();
	  
}

function addText(index, opac) {

    textArray = [];
    bodyArray = [];
    
    var name = objectsArray[index].name;
    var _x = 425;
    var _y = 70;
    
    var txt_name = drawTitle(name, _x, _y, opac);
    
    textArray.push(txt_name);
    var txt_body = drawBody(index,_x, _y, opac); 
    
    if (opac <= 1) {
       fadeInDesc();
    }
    
    if (opac > 1) {
       revealCount++;
       firstReveal = false;
    }
 
}


function drawTitle(name, x, y, opac) {

    this._x = x;
    this._y = y;

    context.font="14px 'Museo 700'";
    context.fillStyle= getTranspColor("#000000", opac);
   
    var txtWidth = context.measureText(name).width;
   
    context.fillText(name, _x + (200-txtWidth)/2, _y);

}


function drawBody(index, x, y, opac) {
  
    var bodyObj = objectsArray[index].listOfPeople;
     
    for (var i=0; i<bodyObj.length; i++) {
         var txt = bodyObj[i].userName;
         bodyArray.push(txt);
    }
     
    if (bodyArray.length > 0) {
         addBodyText(opac);
    } 
}


function addBodyText(opac) {

     for (var i=0; i<bodyArray.length; i++) {
          drawBodyText(bodyArray[i], 445, 90 + i * 20 + 5, opac);
     }
 
}


function drawBodyText(str, x,  y, opac) {

    context.font="12px Helvetica";
    context.fillStyle=getTranspColor("#000000", opac);
    var txtWidth = context.measureText(str).width;
   
    context.fillText(str, x + 10, y, 200);
    context.closePath();
}


function chartNames() {
     
     if (firstReveal==false) {
         for (var i=0; i<slicesArray.length; i++) {
             var ca = slicesArray[i].sa + (slicesArray[i].ea - slicesArray[i].sa)/2;
             slicesArray[i].ca = ca;
         }
         
         drawDescLines(1);
     }

}


function addNames(alpha) {


    if (firstReveal == true) {
      for (var i=0; i<slicesArray.length; i++) {
           var ca = slicesArray[i].sa + (slicesArray[i].ea - slicesArray[i].sa)/2;
           slicesArray[i].ca = ca;
       }
       chart();
       drawDescLines(alpha);
    }

}


function drawDescLines(alpha) {
    
     for (var i=0; i<slicesArray.length; i++) {
     
        var ang = slicesArray[i].ca;
      
        var stR = radius - 10;
        var endR = radius + 20;
     
        var stPointX = centerX + Math.cos(ang) * stR;
        var stPointY = centerY + Math.sin(ang) * stR;
        
        var endPointX = centerX + Math.cos(ang) * endR;
        var endPointY = centerY + Math.sin(ang) * endR;
        
        context.strokeStyle = "#A2A2A2";
        context.lineWidth=0.5;
        
        context.save();
        context.beginPath();
        context.moveTo(stPointX, stPointY);
        context.lineTo(endPointX, endPointY);
      
        context.stroke();
        
        slicesArray[i].cpointX = endPointX;
        slicesArray[i].cpointY = endPointY;
    
    }
    
    for (var j=0; j<slicesArray.length; j++) {
       
       var fpoint = 0;
       var txtpoint = 0;
       
       var index = slicesArray[j].index;
       var str = objectsArray[index].name;
       var txtWidth = context.measureText(str).width;
       
       
       if (slicesArray[j].ca >= 0 && slicesArray[j].ca <= 1.5) {
           fpoint = slicesArray[j].cpointX+5;
           txtpoint = fpoint + 2;
       } else 
       if (slicesArray[j].ca > 1.5 && slicesArray[j].ca <= 3) {
          fpoint = slicesArray[j].cpointX-5; 
          txtpoint = fpoint - txtWidth;
       } else 
       if (slicesArray[j].ca > 3 && slicesArray[j].ca <= 4.5) {
          fpoint = slicesArray[j].cpointX-5; 
          txtpoint = fpoint - txtWidth;
       } else 
       if (slicesArray[j].ca > 4.5 && slicesArray[j].ca <= 6.3) {
          fpoint = slicesArray[j].cpointX+5; 
          txtpoint = fpoint + 2;
       }
    
        context.strokeStyle = getTranspColor("#A2A2A2", alpha);
        context.lineWidth=0.5;
        
        context.save();
        context.beginPath();
        context.moveTo(slicesArray[j].cpointX, slicesArray[j].cpointY);
        context.lineTo(fpoint, slicesArray[j].cpointY);
      
        context.stroke();
        
        context.font="13px 'Museo 700'";
        context.fillStyle=getTranspColor("#000000", alpha);
       
        context.beginPath();
        context.fillText(str, txtpoint, slicesArray[j].cpointY+3);
        context.closePath();
        context.stroke();

    }
}
