

mat4 scale(float x, float y, float z){
    return mat4(
        vec4(x,   0.0, 0.0, 0.0),
        vec4(0.0, y,   0.0, 0.0),
        vec4(0.0, 0.0, z,   0.0),
        vec4(0.0, 0.0, 0.0, 1.0)
    );
}

const float HAND_DST = 0.3;
float modulator(float x, float y) {
  return x - y * floor(x/y);
}

float MatIndex(int i, in mat4 target) {
	int x = (i * 3) % 4;
	int y = i/4;

	return target[x][y];
}

// Position
vec4 Animation(in vec4 pos) {
	v_animation = float(animation);
	v_matter = vec3(float(matter.x)/NORMALIZER, float(matter.y)/NORMALIZER, float(matter.z)/NORMALIZER);
	v_vel = vec3(velocity);

	if(animation == ANIM_NO_EFFECT) {
		return pos;
	}

	float xyz = pos.x * pos.y *pos.z;
	float tes = sin(xyz  + time * 1.  ) * 0.0001 +
	sin(xyz  + time * 0.000005  ) * 0.05 +
	sin(xyz  + time * 0.00001  ) * 0.01;

	pos.x += tes;
	pos.y += tes +  0.05 * (-audioHigh/2000.);
	pos.z += tes;

    for(int i = 0; i < 5; i++) {
		vec3 target = vec3(MatIndex(i*3, handLeft), MatIndex(i*3+1, handLeft), MatIndex(i*3+2, handLeft));
		float dist = length(v_pos - target );
		if(dist < HAND_DST) {
			pos.xyz = mix(target, pos.xyz, dist/ HAND_DST);
		}
	}

	return pos;
}


// Rotations, maybe scale?
mat4 AnimationMatrix(in mat4 mvMatrix) {
	if(animation == ANIM_NO_EFFECT) {
		return mvMatrix;
	}
    float lav = (1. + audioLow * 0.00125);

    mvMatrix = mvMatrix * scale(lav * float(size.x), lav * float(size.y), float(size.z) * lav);
	return mvMatrix;
}

