
var CV = CV || {};

CV.Image = function(width, height, data){
  this.width = width || 0;
  this.height = height || 0;
  this.data = data || [];
};

CV.grayscale = function(imageSrc){
  var src = imageSrc.data, len = src.length, dst = [], i = 0, j = 0;

  for (; i !== len; i += 4){
    dst[j ++] =
      (src[i] * 0.299 + src[i + 1] * 0.587 + src[i + 2] * 0.114 + 0.5) & 0xff;
  }
  
  return new CV.Image(imageSrc.width, imageSrc.height, dst);
};

CV.threshold = function(imageSrc, threshold){
  var src = imageSrc.data, dst = [], tab = [], i;

  i = 256;
  while(i --){
    tab[i] = i <= threshold? 0: 255;
  }

  i = src.length;
  while(i --){
    dst[i] = tab[ src[i] ];
  }

  return new CV.Image(imageSrc.width, imageSrc.height, dst);
};

CV.adaptiveThreshold = function(imageSrc, kernelSize, threshold){
  var src = imageSrc.data, len = src.length, dst = [], tab = [],
      mean, i;

  mean = CV.gaussianBlur(imageSrc, kernelSize).data;

  i = 768;
  while(i --){
    tab[i] = (i - 255 <= -threshold)? 255: 0;
  }

  i = len;
  while(i --){
    dst[i] = tab[ src[i] - mean[i] + 255 ];
  }

  return new CV.Image(imageSrc.width, imageSrc.height, dst);
};

CV.otsu = function(imageSrc){
  var src = imageSrc.data, len = src.length, hist = [],
      threshold = 0, sum = 0, sumB = 0, wB = 0, wF = 0, max = 0,
      mu, between, i;

  i = 256;
  while(i --){
    hist[i] = 0;
  }
  
  i = len;
  while(i --){
    hist[ src[i] ] ++;
  }

  i = 256;
  while(i --){
    sum += hist[i] * i;
  }

  i = 256;
  while(i --){
    wB += hist[i];
    if (wB !== 0){
    
      wF = len - wB;
      if (wF === 0){
        break;
      }

      sumB += hist[i] * i;
      
      mu = (sumB / wB) - ( (sum - sumB) / wF );

      between = wB * wF * mu * mu;
      
      if (between > max){
        max = between;
        threshold = i;
      }
    }
  }

  return threshold;
};

CV.gaussianBlur = function(imageSrc, kernelSize){
  var imageMean = new CV.Image(imageSrc.width, imageSrc.height),
      imageDst = new CV.Image(imageSrc.width, imageSrc.height),
      kernel = CV.gaussianKernel(kernelSize);

  CV.gaussianBlurFilter(imageSrc, imageMean, kernel, true);
  CV.gaussianBlurFilter(imageMean, imageDst, kernel, false);

  return imageDst;
};

CV.gaussianBlurFilter = function(imageSrc, imageDst, kernel, horizontal){
  var src = imageSrc.data, dst = imageDst.data,
      height = imageSrc.height, width = imageSrc.width,
      pos = (height * width) - 1, limit = kernel.length >> 1,
      cur, value, i, j, k;
      
  i = height;
  while(i --){
    
    j = width;
    while(j --){
      value = 0;
    
      for (k = -limit; k <= limit; ++ k){

        if (horizontal){
          cur = pos + k;
          if (j + k < 0){
            cur = pos;
          }
          else if (j + k >= width){
            cur = pos;
          }
        }else{
          cur = pos + (k * width);
          if (i + k < 0){
            cur = pos;
          }
          else if (i + k >= height){
            cur = pos;
          }
        }

        value += kernel[limit + k] * src[cur];
      }
    
      dst[pos --] = horizontal? value: (value + 0.5) & 0xff;
    }
  }

  return imageDst;
};

CV.gaussianKernel = function(kernelSize){
  var tab =
    [ [1],
      [0.25, 0.5, 0.25],
      [0.0625, 0.25, 0.375, 0.25, 0.0625],
      [0.03125, 0.109375, 0.21875, 0.28125, 0.21875, 0.109375, 0.03125] ];

  var kernel = [], center, sigma, scale2X, sum, x, i;

  if ( (kernelSize <= 7) && (kernelSize % 2 === 1) ){
    kernel = tab[kernelSize >> 1];
  }else{
    center = (kernelSize - 1) * 0.5;
    sigma = 0.8 + (0.3 * (center - 1) );
    scale2X = -0.5 / (sigma * sigma);
    sum = 0;
    for (i = 0; i !== kernelSize; ++ i){
      x = i - center;
      sum += kernel[i] = Math.exp(scale2X * x * x);
    }
    sum = 1 / sum;
    for (i = 0; i < kernelSize; ++ i){
      kernel[i] *= sum;
    }  
  }

  return kernel;
};

CV.findContours = function(imageSrc){
  var width = imageSrc.width, height = imageSrc.height, contours = [],
      src, deltas, pos, pix, nbd, outer, hole, i, j;
  
  src = CV.binaryBorder(imageSrc);

  deltas = CV.neighborhoodDeltas(width + 2);

  pos = width + 3;
  nbd = 1;

  for (i = 0; i < height; ++ i, pos += 2){
  
    for (j = 0; j < width; ++ j, ++ pos){
      pix = src[pos];

      if (pix !== 0){
        outer = hole = false;

        if (pix === 1 && src[pos - 1] === 0){
          outer = true;
        }
        else if (pix >= 1 && src[pos + 1] === 0){
          hole = true;
        }

        if (outer || hole){
          ++ nbd;
          
          contours.push( CV.borderFollowing(src, pos, nbd, {x: j, y: i}, hole, deltas) );
        }
      }
    }
  }  

  return contours;
};

CV.borderFollowing = function(src, pos, nbd, point, hole, deltas){
  var contour = [], pos1, pos3, pos4, s, s_end, s_prev;

  contour.hole = hole;
      
  s = s_end = hole? 0: 4;
  do{
    s = (s - 1) & 7;
    pos1 = pos + deltas[s];
    if (src[pos1] !== 0){
      break;
    }
  }while(s !== s_end);
  
  if (s === s_end){
    src[pos] = -nbd;
    contour.push( {x: point.x, y: point.y} );

  }else{
    pos3 = pos;
    s_prev = s ^ 4;

    while(true){
      s_end = s;
    
      do{
        pos4 = pos3 + deltas[++ s];
      }while(src[pos4] === 0);
      
      s &= 7;
      
      if ( ( (s - 1) >>> 0) < (s_end >>> 0) ){
        src[pos3] = -nbd;
      }
      else if (src[pos3] === 1){
        src[pos3] = nbd;
      }

      contour.push( {x: point.x, y: point.y} );
      
      s_prev = s;

      point.x += CV.neighborhood[s][0];
      point.y += CV.neighborhood[s][1];

      if ( (pos4 === pos) && (pos3 === pos1) ){
        break;
      }
      
      pos3 = pos4;
      s = (s + 4) & 7;
    }
  }

  return contour;
};

CV.neighborhood = 
  [ [1, 0], [1, -1], [0, -1], [-1, -1], [-1, 0], [-1, 1], [0, 1], [1, 1] ];

CV.neighborhoodDeltas = function(width){
  var deltas = [], i = CV.neighborhood.length;
  
  while(i --){
    deltas[i] = CV.neighborhood[i][0] + (CV.neighborhood[i][1] * width);
  }
  
  return deltas.concat(deltas);
};

CV.approxPolyDP = function(contour, epsilon){
  var slice = {start_index: 0, end_index: 0},
      right_slice = {start_index: 0, end_index: 0},
      poly = [], stack = [], len = contour.length,
      pt, start_pt, end_pt, dist, max_dist, le_eps,
      dx, dy, i, j, k;
  
  epsilon *= epsilon;
  
  k = 0;
  
  for (i = 0; i !== 3; ++ i){
    max_dist = 0;
    
    k = (k + right_slice.start_index) % len;
    start_pt = contour[k];
    if (++ k === len) {k = 0;}
  
    for (j = 1; j !== len; ++ j){
      pt = contour[k];
      if (++ k === len) {k = 0;}
    
      dx = pt.x - start_pt.x;
      dy = pt.y - start_pt.y;
      dist = dx * dx + dy * dy;

      if (dist > max_dist){
        max_dist = dist;
        right_slice.start_index = j;
      }
    }
  }

  if (max_dist <= epsilon){
    poly.push( {x: start_pt.x, y: start_pt.y} );

  }else{
    slice.start_index = k;
    slice.end_index = (right_slice.start_index += slice.start_index);
  
    right_slice.start_index -= right_slice.start_index >= len? len: 0;
    right_slice.end_index = slice.start_index;
    if (right_slice.end_index < right_slice.start_index){
      right_slice.end_index += len;
    }
    
    stack.push( {start_index: right_slice.start_index, end_index: right_slice.end_index} );
    stack.push( {start_index: slice.start_index, end_index: slice.end_index} );
  }

  while(stack.length !== 0){
    slice = stack.pop();
    
    end_pt = contour[slice.end_index % len];
    start_pt = contour[k = slice.start_index % len];
    if (++ k === len) {k = 0;}
    
    if (slice.end_index <= slice.start_index + 1){
      le_eps = true;
    
    }else{
      max_dist = 0;

      dx = end_pt.x - start_pt.x;
      dy = end_pt.y - start_pt.y;
      
      for (i = slice.start_index + 1; i < slice.end_index; ++ i){
        pt = contour[k];
        if (++ k === len) {k = 0;}
        
        dist = Math.abs( (pt.y - start_pt.y) * dx - (pt.x - start_pt.x) * dy);

        if (dist > max_dist){
          max_dist = dist;
          right_slice.start_index = i;
        }
      }
      
      le_eps = max_dist * max_dist <= epsilon * (dx * dx + dy * dy);
    }
    
    if (le_eps){
      poly.push( {x: start_pt.x, y: start_pt.y} );

    }else{
      right_slice.end_index = slice.end_index;
      slice.end_index = right_slice.start_index;

      stack.push( {start_index: right_slice.start_index, end_index: right_slice.end_index} );
      stack.push( {start_index: slice.start_index, end_index: slice.end_index} );
    }
  }
  
  return poly;
};

CV.warp = function(imageSrc, contour, warpSize){
  var src = imageSrc.data, width = imageSrc.width,
      dst = [], square = [], pos = 0,
      m, d, x, y, i, j;
  
  square[0] = {x: 0, y: 0};
  square[1] = {x: warpSize - 1, y: 0};
  square[2] = {x: warpSize - 1, y: warpSize - 1};
  square[3] = {x: 0, y: warpSize - 1};

  m = CV.getPerspectiveTransform(contour, square);

  for (i = 0; i !== warpSize; ++ i){

    for (j = 0; j !== warpSize; ++ j){

      d = m[6] * j + m[7] * i + m[8];
      x = ( m[0] * j + m[1] * i + m[2] ) / d;
      y = ( m[3] * j + m[4] * i + m[5] ) / d;

      dst[pos ++] = src[ (y + 0.5 >>> 0) * width + (x + 0.5 >>> 0) ];
    }
  }

  return new CV.Image(warpSize, warpSize, dst);
};

CV.getPerspectiveTransform = function(src, dst){
  var du, dv, rq;

  rq = CV.square2quad(src);
  
  du = dst[1].x - dst[0].x;
  dv = dst[2].y - dst[0].y;
  
  rq[0] /= du;
  rq[1] /= dv;
  rq[2] -= rq[0] * dst[0].x + rq[1] * dst[0].y;
  rq[3] /= du;
  rq[4] /= dv;
  rq[5] -= rq[3] * dst[0].x + rq[4] * dst[0].y;
  rq[6] /= du;
  rq[7] /= dv;
  rq[8] -= rq[6] * dst[0].x + rq[7] * dst[0].y;
  
  return rq;
};

CV.square2quad = function(src){
  var sq = [ [], [], [] ],
      px, py, dx1, dx2, dy1, dy2, den;
  
  px = src[0].x - src[1].x + src[2].x - src[3].x;
  py = src[0].y - src[1].y + src[2].y - src[3].y;
  
  if (0 === px && 0 === py){
    sq[0] = src[1].x - src[0].x;
    sq[1] = src[2].x - src[1].x;
    sq[2] = src[0].x;
    sq[3] = src[1].y - src[0].y;
    sq[4] = src[2].y - src[1].y;
    sq[5] = src[0].y;
    sq[6] = 0;
    sq[7] = 0;
    sq[8] = 1;

  }else{
    dx1 = src[1].x - src[2].x;
    dx2 = src[3].x - src[2].x;
    dy1 = src[1].y - src[2].y;
    dy2 = src[3].y - src[2].y;
    den = dx1 * dy2 - dx2 * dy1;
  
    sq[6] = (px * dy2 - dx2 * py) / den;
    sq[7] = (dx1 * py - px * dy1) / den;
    sq[8] = 1;
    sq[0] = src[1].x - src[0].x + sq[6] * src[1].x;
    sq[1] = src[3].x - src[0].x + sq[7] * src[3].x;
    sq[2] = src[0].x;
    sq[3] = src[1].y - src[0].y + sq[6] * src[1].y;
    sq[4] = src[3].y - src[0].y + sq[7] * src[3].y;
    sq[5] = src[0].y;
  }

  return sq;
};

CV.isContourConvex = function(contour){
  var orientation = 0, convex = true, len = contour.length,
      cur_pt, prev_pt, dxdy0, dydx0, dx0, dy0, dx, dy, i, j;

  prev_pt = contour[len - 1];
  cur_pt = contour[0];

  dx0 = cur_pt.x - prev_pt.x;
  dy0 = cur_pt.y - prev_pt.y;

  for (i = 0, j = 0; i !== len; ++ i){
    if (++ j === len) {j = 0;}

    prev_pt = cur_pt;
    cur_pt = contour[j];

    dx = cur_pt.x - prev_pt.x;
    dy = cur_pt.y - prev_pt.y;
    dxdy0 = dx * dy0;
    dydx0 = dy * dx0;

    orientation |= dydx0 > dxdy0? 1: (dydx0 < dxdy0? 2: 3);

    if (orientation === 3){
        convex = false;
        break;
    }

    dx0 = dx;
    dy0 = dy;
  }

  return convex;
};

CV.perimeter = function(poly){
  var p = 0, dx, dy, i, j;

  for (i = 0, j = 0; i !== poly.length; ++ i){
    if (++ j === poly.length) {j = 0;}
    
    dx = poly[i].x - poly[j].x;
    dy = poly[i].y - poly[j].y;
    
    p += Math.sqrt(dx * dx + dy * dy) ;
  }

  return p;
};

CV.minEdgeLength = function(poly){
  var len = Infinity, d, dx, dy, i, j;

  for (i = 0, j = 0; i !== poly.length; ++ i){
    if (++ j === poly.length) {j = 0;}
    
    dx = poly[i].x - poly[j].x;
    dy = poly[i].y - poly[j].y;

    d = dx * dx + dy * dy;

    if (d < len){
      len = d;
    }
  }
  
  return Math.sqrt(len);
};

CV.countNonZero = function(imageSrc, square){
  var src = imageSrc.data, nz = 0, pos, i, j;

  pos = square.x + (square.y * imageSrc.width);
  
  for (i = 0; i !== square.height; ++ i){

    for (j = 0; j !== square.width; ++ j){
    
      if ( src[pos ++] !== 0 ){
        ++ nz;
      }
    }
    
    pos += imageSrc.width - square.width;
  }

  return nz;
};

CV.binaryBorder = function(imageSrc){
  var src = imageSrc.data, width = imageSrc.width, height = imageSrc.height,
      dst = [], posSrc = 0, posDst = 0, i, j;

  j = width + 2;
  while(j --){
    dst[posDst ++] = 0;
  }

  i = height;
  while(i --){
    dst[posDst ++] = 0;
    j = width;
    while(j --){
      dst[posDst ++] = src[posSrc ++]? 1: 0;
    }
    dst[posDst ++] = 0;
  }

  j = width + 2;
  while(j --){
    dst[posDst ++] = 0;
  }
  
  return dst;
};
