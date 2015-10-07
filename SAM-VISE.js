var app = angular.module('SAMVISE', [ ]);

//=============================================================================
// SAMVISEController - controller for SAM-VISE.html
//=============================================================================
app.controller('SAMVISEController', function ($scope) {
    var theCanvas = document.getElementById('theCanvas');
    var context = theCanvas.getContext("2d");

    $scope.spots = [];
    $scope.fileName = "";
    var lastSpot = 0;

    //-----------------------------------------------------------------------------
    function drawSpots() {
      context.clearRect(0, 0, theCanvas.width, theCanvas.height);
      context.globalAlpha = 0.15;
      context.fillStyle = 'Crimson';
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
    $scope.onCreate = function() {
      defWidth = Math.min(theCanvas.width, 100);
      defHeight = Math.min(theCanvas.height, 50);
      // create the spot at the center of the canvas
      $scope.spots.push({ name: "SP" + ("00" + (++lastSpot).toString()).slice(-2), x : (theCanvas.width - defWidth) / 2, y : (theCanvas.height - defHeight) / 2, width : defWidth, height : defHeight });
      drawSpots();
    };

    //-----------------------------------------------------------------------------
    // canvas event listeners for dragging & resizing
    // source: RectangleWorld by DanGries (http://rectangleworld.com)
    //-----------------------------------------------------------------------------

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
        // manual $apply as this function is called outside the standard digest cycle
        $scope.$apply();
  		}
  	}

    //-----------------------------------------------------------------------------
  	function mouseMoveListener(evt) {
      var SIZE_DRAG_OFFSET = 10; // if holding inside 10px from the border, size instead of move
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

    // register the mousedown listener
    theCanvas.addEventListener("mousedown", mouseDownListener, false);

});