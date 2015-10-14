var app = angular.module('SAMVISE', [ ]);
//=============================================================================
// SAMVISEController - controller for SAM-VISE.html
//=============================================================================
app.controller('SAMVISEController', function ($scope) {
  var theCanvas = document.getElementById('theCanvas');
  var context = theCanvas.getContext("2d");

  $scope.markdown = "";
  $scope.spots = [];
  $scope.fileName = "";
  $scope.spotName = {
          template: "SP01",
          radix: "SP",
          mask: "00"
      };
  var lastSpot = 0;

  //-----------------------------------------------------------------------------
  function drawSpots() {
    context.clearRect(0, 0, theCanvas.width, theCanvas.height);
    context.globalAlpha = 0.15;
    context.fillStyle = 'Green';
    $scope.spots.forEach(function(spot){
      context.fillRect(spot.x, spot.y, spot.width, spot.height);
    });
    context.globalAlpha = 1;
  }

  //-----------------------------------------------------------------------------
  function clearAll() {
    $scope.spots = [];
    lastSpot = 0;
    context.clearRect(0, 0, theCanvas.width, theCanvas.height);
  }

  //-----------------------------------------------------------------------------
  $scope.onFileChanged = function(element) {
      clearAll();
      $scope.fileName = element.files[0].name;
      // manual $apply as this function is called outside the standard digest cycle
      $scope.$apply();
      var reader = new FileReader();
      reader.onload = function() {
        // the image object is loaded just to get the actual image size and resize the canvas
        var image = new Image();
        image.src = this.result;
        image.onload = function() {
          theCanvas.height = this.height;
          theCanvas.width = this.width;
        };
        theCanvas.style.backgroundImage = "url(" +this.result + ")";
      };
      reader.readAsDataURL(element.files[0]);
  };

  //-----------------------------------------------------------------------------
  function getNextSpotName() {
      return $scope.spotName.radix + ($scope.spotName.mask + (++lastSpot).toString()).slice(-$scope.spotName.mask.length);
  }

  //-----------------------------------------------------------------------------
  function adjustSpotNameTemplate() {
    idx = $scope.spotName.template.search("[0-9]");
    if (idx !== -1) {
        $scope.spotName.radix = $scope.spotName.template.slice(0, idx);
        progLen = $scope.spotName.template.length - idx;
        lastSpot = parseInt($scope.spotName.template.slice(-progLen)) - 1;
        $scope.spotName.mask = "";
        for (i = 0; i < progLen; i++)
            $scope.spotName.mask += "0";
    } else {
        $scope.spotName.radix = $scope.spotName.template;
        $scope.spotName.mask = "00";
        lastSpot = 0;
    }
  }

  //-----------------------------------------------------------------------------
  $scope.onSpotNameTemplateChanged = function () {
    adjustSpotNameTemplate();
    for (s = 0; s < $scope.spots.length; s++) {
        $scope.spots[s].name = getNextSpotName();
    }
  };

  //-----------------------------------------------------------------------------
  $scope.onCreate = function () {
    defWidth = Math.min(theCanvas.width, 100);
    defHeight = Math.min(theCanvas.height, 50);
    // create the spot at the center of the canvas
    $scope.spots.push({ name: getNextSpotName(), x: (theCanvas.width - defWidth) / 2, y: (theCanvas.height - defHeight) / 2, width: defWidth, height: defHeight });
    drawSpots();
  };

  //-----------------------------------------------------------------------------
  $scope.onRemoveSpotClicked = function($index) {
    $scope.spots.splice($index, 1);
  };

  //-----------------------------------------------------------------------------
  $scope.onMarkdownChanged = function() {
    newSpots = [];
    lines = $scope.markdown.split("\n");
    lines.forEach(function(line) {
       var match = "[IMGSPOT ";
       if (line.indexOf(match) != -1) {
         var coords = line.substr(0,line.length - 1).slice(match.length).split(/[-x ]/);
         if (coords.length == 5)
          newSpots.push({ name : coords[4].replace(/"/g,''), x : parseInt(coords[0]), y : parseInt(coords[1]), height : parseInt(coords[2]), width : parseInt(coords[3]) });
       }
    });
    if (newSpots.length > 0) {
      $scope.spots = newSpots;
      $scope.spotName.template = $scope.spots[$scope.spots.length - 1].name;
      adjustSpotNameTemplate();
      lastSpot++;
      $scope.spotName.template = getNextSpotName();
      lastSpot--;
      markdown = "";
      drawSpots();
    }

  };

  //-----------------------------------------------------------------------------
  $scope.onCopyClipboard = function () {
      resultMarkdown = document.querySelector('#resultMarkdown');

      range = document.createRange();

      range.selectNode(resultMarkdown);
      document.getSelection().addRange(range);

      document.execCommand('copy');

      document.getSelection().removeAllRanges();
  };

  //-----------------------------------------------------------------------------
  // canvas event listeners for dragging & resizing
  // partially inspired to a sample from RectangleWorld by DanGries (http://rectangleworld.com)
  //-----------------------------------------------------------------------------

  var SIZE_DRAG_OFFSET = 10; // if the mouse is inside 10px from the border, size instead of move
  var dragging = false;

  //-----------------------------------------------------------------------------
  function mouseDownListener(evt) {
    var i;
    //We are going to pay attention to the layering order of the objects so that if a mouse down occurs over more than object,
    //only the topmost one will be dragged.
    var highestIndex = -1;

    //getting mouse position correctly, being mindful of resizing that may have occured in the browser:
    var bRect = theCanvas.getBoundingClientRect();
    mouseX = (evt.clientX - bRect.left)*(theCanvas.width / bRect.width);
    mouseY = (evt.clientY - bRect.top)*(theCanvas.height / bRect.height);

    //find which spot was clicked
    for (i = 0; i < $scope.spots.length; i++) {
      if	(hitTest($scope.spots[i], mouseX, mouseY)) {
        dragging = true;
        if (i > highestIndex) {
          //We will pay attention to the point on the object where the mouse is "holding" the object:
          dragHoldX = mouseX - $scope.spots[i].x;
          dragHoldY = mouseY - $scope.spots[i].y;
          highestIndex = i;
          dragIndex = i;
        }
      }
    }

    if (dragging) {
      theCanvas.removeEventListener("mousemove", mouseHoverListener, false);
      window.addEventListener("mousemove", mouseMoveListener, false);
    }
    theCanvas.removeEventListener("mousedown", mouseDownListener, false);
    window.addEventListener("mouseup", mouseUpListener, false);

    //code below prevents the mouse down from having an effect on the main browser window:
    if (evt.preventDefault) {
      evt.preventDefault();
    } //standard
    else if (evt.returnValue) {
      evt.returnValue = false;
    } //older IE
    return false;
  }

  //-----------------------------------------------------------------------------
  function mouseUpListener(evt) {
    theCanvas.addEventListener("mousedown", mouseDownListener, false);
    window.removeEventListener("mouseup", mouseUpListener, false);
    if (dragging) {
      dragging = false;
      window.removeEventListener("mousemove", mouseMoveListener, false);
      theCanvas.addEventListener("mousemove", mouseHoverListener, false);
      // manual $apply as this function is called outside the standard digest cycle
      $scope.$apply();
    }
  }

  //-----------------------------------------------------------------------------
  function mouseMoveListener(evt) {
    var spot = $scope.spots[dragIndex];

    //getting mouse position correctly
    var bRect = theCanvas.getBoundingClientRect();
    mouseX = (evt.clientX - bRect.left) * (theCanvas.width / bRect.width);
    mouseY = (evt.clientY - bRect.top) * (theCanvas.height / bRect.height);

    //........................................................................
    function DoMove() {
      maxX = theCanvas.width - spot.width;
      maxY = theCanvas.height - spot.height;

      // clamp x and y positions to prevent object from dragging outside of canvas
      posX = mouseX - dragHoldX;
      posX = (posX < 0) ? 0 : ((posX > maxX) ? maxX : posX);
      posY = mouseY - dragHoldY;
      posY = (posY < 0) ? 0 : ((posY > maxY) ? maxY : posY);

      spot.x = posX;
      spot.y = posY;
    }

    //........................................................................
    function DoSizeX() {
      maxWidth = theCanvas.width - spot.x;

      // prevent spot to become too small
      newWidth = (mouseX - spot.x) + (spot.width - dragHoldX);
      newWidth = (newWidth < SIZE_DRAG_OFFSET) ?  SIZE_DRAG_OFFSET : ((newWidth > maxWidth) ? maxWidth : newWidth);

      // keep holding position at the same relative point
      dragHoldX += newWidth - spot.width;
      spot.width = newWidth;
    }

    //........................................................................
    function DoSizeY() {
      maxHeight = theCanvas.height - spot.y;

      // prevent spot to become too small
      newHeight = (mouseY - spot.y) + (spot.height - dragHoldY);
      newHeight = (newHeight < SIZE_DRAG_OFFSET) ?  SIZE_DRAG_OFFSET : ((newHeight > maxHeight) ? maxHeight : newHeight);

      // keep holding position at the same relative point
      dragHoldY += newHeight - spot.height;
      spot.height = newHeight;
    }

    // determine the action according to the holding position
    if (dragHoldX > spot.width - SIZE_DRAG_OFFSET && dragHoldY <= spot.height - SIZE_DRAG_OFFSET) {
      DoSizeX();
    } else if (dragHoldX <= spot.width - SIZE_DRAG_OFFSET && dragHoldY > spot.height - SIZE_DRAG_OFFSET) {
      DoSizeY();
    } else if (dragHoldX > spot.width - SIZE_DRAG_OFFSET && dragHoldY > spot.height - SIZE_DRAG_OFFSET) {
      DoSizeX();
      DoSizeY();
    } else {
      DoMove();
    }

    drawSpots();
  }

  //-----------------------------------------------------------------------------
  function hitTest(spot,mx,my) {
    // a "hit" will be registered if the mouse clicked inside the rectangle
    return (mx > spot.x && mx < (spot.x + spot.width) && my > spot.y && my < (spot.y + spot.height));
  }

  //-----------------------------------------------------------------------------
  function mouseHoverListener(evt) {
    var rect = theCanvas.getBoundingClientRect();
    mouseX = (evt.clientX - rect.left)*(theCanvas.width / rect.width);
    mouseY = (evt.clientY - rect.top)*(theCanvas.height / rect.height);
    hovered = null;
    for (i = 0; i < $scope.spots.length; i++) {
      if	(hitTest($scope.spots[i], mouseX, mouseY)) {
       hovered = $scope.spots[i];
      }
    }
    if (hovered) {
      if (hovered.x + hovered.width - mouseX < SIZE_DRAG_OFFSET && hovered.y + hovered.height - mouseY >= SIZE_DRAG_OFFSET) {
        theCanvas.style.cursor = 'ew-resize';
      } else if (hovered.x + hovered.width - mouseX >= SIZE_DRAG_OFFSET && hovered.y + hovered.height - mouseY < SIZE_DRAG_OFFSET) {
          theCanvas.style.cursor = 'ns-resize';
      } else if (hovered.x + hovered.width - mouseX < SIZE_DRAG_OFFSET && hovered.y + hovered.height - mouseY < SIZE_DRAG_OFFSET) {
          theCanvas.style.cursor = 'nwse-resize';
      } else {
        theCanvas.style.cursor = 'move';
      }
    } else {
      theCanvas.style.cursor = 'inherit';
    }
  }

  // register the event listeners
  theCanvas.addEventListener("mousedown", mouseDownListener, false);
  theCanvas.addEventListener("mousemove", mouseHoverListener, false);
});
