/**
 * Draws a quadratic Bezier line (http://en.wikipedia.org/wiki/B%C3%A9zier_curve) going from "from" to "to",
 * according to the options given. Available options are:
 *   - color, opacity and weight: Same as for GPolyline.
 *   - steps: Number of steps taken between "from" and "to" along the Bezier line. The GPolyline will contain steps + 1 vertices.
 *   - controlPoint: The control point for the quadratic Bezier line. If not given, one will be calculated, using the curveFactor.
 *   - curveFactor: The calculateed control point is equal to the middle-point between "from" and "to", with an offset. A curveFactor 
 *     of 0.5 makes the distance from the control point to the line between "from" and "to" be half the distance between "from" and "to".
 * 
 * Notes: Please be advised that this current version actually draws the line on the surface of the planet, which means that lines
 *        will be more and more distorted the closer to the poles they are drawn.
 *        
 *        Methods in this class are only needed by the class itself. Users need only call the constructor with the right options. 
 *        If a change on a line is needed, a user should create another one and not modify the old one.
 *        Also, the mergeOptions function is only used inside the constructor, but it didn't seem to make sense to make it a method.
 * 
 * Usage: 
 *   var curve = new QuadraticBezierLine(from, to, {options});
 *   map.addOverlay(curve);
 * 
 * @param {GLatLng} from
 * @param {GLatLng} to
 * @param {Object} opts
 * 
 * @author Marcelo Alvim
 * 
 * Code licensed under the WTFPL version 2. For more details see the COPYING file.
 */
var QuadraticBezierLine = function(from, to, opts) {
	this.from = from;
	this.to = to;
	this.opts = QuadraticBezierLine.defaults; // WorldView.Util.mergeOptions(opts, QuadraticBezierLine.defaults);
	this.control = this.opts.controlPoint || this.calculateControlPoint();
	this.points = null;
	GPolyline.call(this, this.getPolylinePoints(), this.opts.color, this.opts.weight, this.opts.opacity);
};

QuadraticBezierLine.prototype = new GPolyline();
QuadraticBezierLine.defaults = {color: "#ff0000", opacity: 0.6, weight: 5, steps: 20, controlPoint: null, curveFactor: 0.4};

/**
 * Gets the array of points that will be used to construct the GPolyline object.
 * 
 * @param {GLatLng} from
 * @param {GLatLng} to
 * @param {Object} opts
 * 
 * @return Array<GLatLng>
 */
QuadraticBezierLine.prototype.getPolylinePoints = function() {
	var self = this;
	
	return this.points || (function() {
		self.points = [];
		var steps = (self.opts.steps % 2 === 0) ? (self.opts.steps) : (self.opts.steps + 1); // number of steps has to be even
		var pt = null;
		for(var t = 0; t <= steps; t++) {
			pt = self.getPoint(t * (1 / steps));
			if(t === (steps / 2)) {
				self.middlePoint = pt;
			}
			self.points.push(pt);
		}
		return self.points;
	})();
};

/**
 * Calculates the control point using the two endpoints and the "curve factor".
 * Does that by calculating the middle point, then offseting it away from the line that connects the two endpoints.
 * The amount of offseting is given by the factor. A factor of 1.0 makes the distance from the point to the line be
 * equal to the length of the line. 0.5 makes it half the line length.
 * 
 * @param {GLatLng} from
 * @param {GLatLng} to
 * @param {float} factor
 * 
 * @return GLatLng
 */
QuadraticBezierLine.prototype.calculateControlPoint = function() {
	var factor = this.opts.curveFactor;
	var middlePoint = {lat: (this.from.lat() + this.to.lat()) / 2.0, lng: (this.from.lng() + this.to.lng()) / 2.0};
	return new GLatLng((middlePoint.lng - this.to.lng()) * factor + middlePoint.lat, (this.to.lat() - middlePoint.lat) * factor + middlePoint.lng);
};

/**
 * Calculates a point in the Bezier line, based on the two endpoints, the control point, and the "t" parameter,
 * which will be between 0 and 1 according to the number of steps.
 * 
 * @param {GLatLng} from
 * @param {GLatLng} control
 * @param {GLatLng} to
 * @param {float} t
 * 
 * @return GLatLng
 */
QuadraticBezierLine.prototype.getPoint = function(t) {
	var lat = this.bezier(t, function(pt) {return pt.lat();});
	var lng = this.bezier(t, function(pt) {return pt.lng();});
	return new GLatLng(lat, lng);
};

/**
 * The actual Quadratic Bezier function. Calculates a number based on the three points and the "t" parameter.
 * 
 * @param {float} t, the current interpolation step
 * @param {function} getValue, a function that will be called with this.from, this.control and this.to, and will
 *   return the value (lat or lng) that will be used to calculate the current point
 * 
 * @return float, the calculated bezier value
 */
QuadraticBezierLine.prototype.bezier = function(t, getValue) {
	return (((1 - t) * (1 - t)) * (getValue(this.from))) + ((2 * t) * (1 - t) * (getValue(this.control))) + ((t * t) * (getValue(this.to)));
};

/**
 * Merges opts into defaults. This is similar to 'extend' functions in frameworks such as jQuery and Prototype. It's just
 * here in order to make this library framework agnostic.
 */
QuadraticBezierLine.mergeOptions = function(opts, defaults) {
	var o = {};
	if(!opts) {
		return defaults;
	} else {
		o = {};
		for(var attr in defaults) {
			if(defaults.hasOwnProperty(attr)) {
				o[attr] = opts[attr] || defaults[attr];
			}
		}
		return o;
	}
};