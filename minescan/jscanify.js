/*! jscanify v1.4.0 | (c) ColonelParrot and other contributors | MIT License */

(function (global, factory) {
  typeof exports === "object" && typeof module !== "undefined"
    ? (module.exports = factory())
    : typeof define === "function" && define.amd
      ? define(factory)
      : (global.jscanify = factory());
})(this, function () {
  "use strict";

  function distance(p1, p2) {
    return Math.hypot(p1.x - p2.x, p1.y - p2.y);
  }

  class jscanify {
    constructor() { }

    findPaperContour(img) {
      const imgGray = new cv.Mat();
      cv.cvtColor(img, imgGray, cv.COLOR_RGBA2GRAY, 0);

      const imgBlur = new cv.Mat();
      cv.GaussianBlur(imgGray, imgBlur, new cv.Size(3, 3), 0);

      const imgThresh = new cv.Mat();
      cv.Canny(imgBlur, imgThresh, 50, 200);

      let contours = new cv.MatVector();
      let hierarchy = new cv.Mat();
      cv.findContours(
        imgThresh,
        contours,
        hierarchy,
        cv.RETR_CCOMP,
        cv.CHAIN_APPROX_SIMPLE
      );

      let maxArea = 0;
      let maxContourIndex = -1;
      for (let i = 0; i < contours.size(); ++i) {
        let contourArea = cv.contourArea(contours.get(i));
        if (contourArea > maxArea) {
          maxArea = contourArea;
          maxContourIndex = i;
        }
      }

      const maxContour =
        maxContourIndex >= 0 ? contours.get(maxContourIndex) : null;

      imgGray.delete();
      imgBlur.delete();
      imgThresh.delete();
      contours.delete();
      hierarchy.delete();
      return maxContour;
    }

    highlightPaper(image, options) {
      options = options || {};
      options.color = options.color || "orange";
      options.thickness = options.thickness || 10;

      const offCanvas = document.createElement("canvas");
      offCanvas.width = image.width;
      offCanvas.height = image.height;
      const offCtx = offCanvas.getContext("2d");
      offCtx.drawImage(image, 0, 0);

      const imgData = offCtx.getImageData(0, 0, offCanvas.width, offCanvas.height);
      let src = cv.matFromImageData(imgData);

      const maxContour = this.findPaperContour(src);

      const canvas = document.createElement("canvas");
      canvas.width = src.cols;
      canvas.height = src.rows;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(image, 0, 0);

      if (maxContour) {
        const { topLeftCorner, topRightCorner, bottomLeftCorner, bottomRightCorner } =
          this.getCornerPoints(maxContour, src);

        if (topLeftCorner && topRightCorner && bottomLeftCorner && bottomRightCorner) {
          ctx.strokeStyle = options.color;
          ctx.lineWidth = options.thickness;
          ctx.beginPath();
          ctx.moveTo(topLeftCorner.x, topLeftCorner.y);
          ctx.lineTo(topRightCorner.x, topRightCorner.y);
          ctx.lineTo(bottomRightCorner.x, bottomRightCorner.y);
          ctx.lineTo(bottomLeftCorner.x, bottomLeftCorner.y);
          ctx.closePath();
          ctx.stroke();
        }
      }

      src.delete();
      return canvas;
    }

    extractPaper(image, resultWidth, resultHeight, cornerPoints) {
      const offCanvas = document.createElement("canvas");
      offCanvas.width = image.width;
      offCanvas.height = image.height;
      const offCtx = offCanvas.getContext("2d");
      offCtx.drawImage(image, 0, 0);

      const imgData = offCtx.getImageData(0, 0, offCanvas.width, offCanvas.height);
      let src = cv.matFromImageData(imgData);

      const maxContour = cornerPoints ? null : this.findPaperContour(src);

      if (maxContour == null && cornerPoints === undefined) {
        src.delete();
        return null;
      }

      const { topLeftCorner, topRightCorner, bottomLeftCorner, bottomRightCorner } =
        cornerPoints || this.getCornerPoints(maxContour, src);

      let warpedDst = new cv.Mat();
      let dsize = new cv.Size(resultWidth, resultHeight);
      let srcTri = cv.matFromArray(4, 1, cv.CV_32FC2, [
        topLeftCorner.x, topLeftCorner.y,
        topRightCorner.x, topRightCorner.y,
        bottomLeftCorner.x, bottomLeftCorner.y,
        bottomRightCorner.x, bottomRightCorner.y,
      ]);

      let dstTri = cv.matFromArray(4, 1, cv.CV_32FC2, [
        0, 0,
        resultWidth, 0,
        0, resultHeight,
        resultWidth, resultHeight,
      ]);

      let M = cv.getPerspectiveTransform(srcTri, dstTri);
      cv.warpPerspective(
        src,
        warpedDst,
        M,
        dsize,
        cv.INTER_LINEAR,
        cv.BORDER_CONSTANT,
        new cv.Scalar()
      );

      const canvas = document.createElement("canvas");
      cv.imshow(canvas, warpedDst);

      src.delete();
      warpedDst.delete();
      srcTri.delete();
      dstTri.delete();
      M.delete();

      return canvas;
    }

    getCornerPoints(contour) {
      let rect = cv.minAreaRect(contour);
      const center = rect.center;

      let topLeftCorner, topRightCorner, bottomLeftCorner, bottomRightCorner;
      let tlDist = 0, trDist = 0, blDist = 0, brDist = 0;

      for (let i = 0; i < contour.data32S.length; i += 2) {
        const point = { x: contour.data32S[i], y: contour.data32S[i + 1] };
        const dist = distance(point, center);

        if (point.x < center.x && point.y < center.y && dist > tlDist) {
          topLeftCorner = point; tlDist = dist;
        } else if (point.x > center.x && point.y < center.y && dist > trDist) {
          topRightCorner = point; trDist = dist;
        } else if (point.x < center.x && point.y > center.y && dist > blDist) {
          bottomLeftCorner = point; blDist = dist;
        } else if (point.x > center.x && point.y > center.y && dist > brDist) {
          bottomRightCorner = point; brDist = dist;
        }
      }

      return { topLeftCorner, topRightCorner, bottomLeftCorner, bottomRightCorner };
    }
  }

  return jscanify;
});
