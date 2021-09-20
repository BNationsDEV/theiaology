uniform float time;
uniform float audioLow;
uniform float audioHigh;

uniform vec3 leftindex;
uniform vec3 leftthumb;
uniform vec3 leftmiddle;
uniform vec3 leftring;
uniform vec3 leftpinky;
uniform vec3 rightindex;
uniform vec3 rightthumb;
uniform vec3 rightmiddle;
uniform vec3 rightring;
uniform vec3 rightpinky;

varying vec3 v_pos;
varying float v_animation;

float modu(float x, float y) {
  return x - y * floor(x/y);
}

vec4 AnimationFrag(in vec4 col) {
	vec3[] pts = vec3[](leftindex, leftthumb, leftmiddle, leftring, leftpinky, rightindex, rightthumb, rightmiddle, rightring, rightpinky);

	float v = 50000000.;
	float xy = modu(v_pos.x * v_pos.y, v);
	float xyz = modu(v_pos.z * v_pos.x * v_pos.y, v);
	float xz = modu(v_pos.x + v_pos.z, v);
	float t= sin(time * 0.00001) * 0.;
	
	col.xyz *= 0.95 + 0.01 * modu(xy * 100.+ t, 2.);
	col.xyz *= 1. + 0.01 * modu(xyz* cos(audioHigh * 0.001 + t), 5.);
	col.xyz *= 0.95 + 0.01 * modu(xyz * 1000. * cos(audioHigh * 0.01 + t) , 4.)* sin(audioLow * 0.01);

    col.xyz *= 1. + (sin(xz * 10.) + cos(10. * xz))* 0.01;


	if(v_animation == float(ANIM_NO_EFFECT)) {
		return col;
	}

	for(int i = 0; i < 10; i++) {
		vec3 target = pts[i];

		float dist = length(v_pos - target );
		if(dist < 0.15) {
			col.xyz += sin(dist * 200. - time * 0.025 )* 0.01;
		}
	}

	col.xyz += (sin(time * 0.00001 + v_pos * 0.05))  * 0.1 + 
	(sin(time * 0.00001 + v_pos * 0.01))  * 0.1;

	// col.xyz = max(min(col.xyz, 1.0), 0.);
	return col;
}
