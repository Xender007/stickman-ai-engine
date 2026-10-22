"""Placeholder SFX so the project renders with sound out of the box.
Swap each file in public/sfx/ for a library sound (same name) when you polish an episode."""
import os
import numpy as np
import scipy.signal as sg
import soundfile as sf

SR = 44100
OUT = os.path.join(os.path.dirname(__file__), "..", "public", "sfx")
os.makedirs(OUT, exist_ok=True)
rng = np.random.default_rng(7)


def tt(d):
    return np.arange(int(d * SR)) / SR


def lp(x, f, order=4):
    return sg.sosfilt(sg.butter(order, f, "low", fs=SR, output="sos"), x)


def hp(x, f, order=2):
    return sg.sosfilt(sg.butter(order, f, "high", fs=SR, output="sos"), x)


def save(name, x, peak):
    x = x / np.max(np.abs(x)) * peak
    sf.write(os.path.join(OUT, name), x.astype(np.float32), SR, subtype="PCM_16")


def echoes(x, taps):
    y = x.copy()
    for delay, gain in taps:
        n = int(delay * SR)
        y[n:] += gain * x[:-n]
    return y


# Calm pad (A minor) for the "normal world" opening.
t = tt(12)
pad = sum(np.sin(2 * np.pi * f * (1 + d) * t + rng.uniform(0, 6.28))
          for f in (110, 164.81, 220, 261.63, 329.63) for d in (-0.004, 0, 0.004))
save("pad.wav", lp(pad, 900) * np.minimum(1, t / 2) * (0.85 + 0.15 * np.sin(2 * np.pi * 0.15 * t)), 0.5)

# Earthquake rumble: brown noise + wobbling sub, saturated.
t = tt(16)
brown = lp(hp(np.cumsum(rng.standard_normal(len(t))), 20), 110)
brown /= np.max(np.abs(brown))
sub = np.sin(2 * np.pi * 38 * t + 2 * np.sin(2 * np.pi * 0.3 * t))
wobble = lp(rng.standard_normal(len(t)), 3)
wobble = 0.7 + 0.3 * wobble / np.max(np.abs(wobble))
save("rumble.wav", np.tanh(2 * (0.8 * brown + 0.35 * sub) * wobble), 0.9)

# Bass boom for slam words / end card: pitch-dropping sub + short crack.
t = tt(3.5)
phase = 2 * np.pi * np.cumsum(32 + 70 * np.exp(-t * 6)) / SR
crack = lp(rng.standard_normal(len(t)), 1800) * np.exp(-t * 18)
save("boom.wav", np.tanh(2.5 * (np.sin(phase) * np.exp(-t * 1.4) + 0.5 * crack)), 0.95)

# Debris/collapse crash: filtered noise burst with a low body.
t = tt(4)
noise = lp(rng.standard_normal(len(t)), 2500) * np.exp(-t * 2.2)
body = lp(rng.standard_normal(len(t)), 150) * np.exp(-t * 1.2) * 4
save("crash.wav", np.tanh(1.5 * (noise + body)), 0.85)

# Tsunami siren: slow rising/falling wail with distance echoes.
t = tt(10)
phase = 2 * np.pi * np.cumsum(620 + 380 * (0.5 - 0.5 * np.cos(2 * np.pi * t / 2.4))) / SR
siren = lp(np.sin(phase) + 0.35 * np.sin(2 * phase) + 0.15 * np.sin(3 * phase), 2500)
siren = echoes(siren, [(0.11, 0.5), (0.23, 0.35), (0.41, 0.2)])
save("siren.wav", siren * np.minimum(1, t / 1.5) * np.minimum(1, (10 - t) / 1.5), 0.6)

# Ear-ring after the big impact (~4 kHz).
t = tt(3.5)
save("ring.wav", np.sin(2 * np.pi * 4200 * t) * np.minimum(1, t / 0.05) * np.minimum(1, (3.5 - t) / 1.2), 0.25)

# Wave roar: pink-ish noise with a slow swell and low body.
t = tt(12)
roar = lp(rng.standard_normal(len(t)), 900) + 2.5 * lp(rng.standard_normal(len(t)), 120)
save("roar.wav", np.tanh(1.2 * roar * (0.75 + 0.25 * np.sin(2 * np.pi * 0.18 * t))), 0.85)

# Rain: high-passed hiss plus scattered droplet ticks.
t = tt(12)
rain = hp(rng.standard_normal(len(t)), 1500) * 0.4
ticks = (rng.random(len(t)) < 0.0015) * rng.standard_normal(len(t)) * 3
save("rain.wav", rain + hp(ticks, 2000), 0.5)

# Thunder: sharp crack into a long rolling rumble.
t = tt(5)
crack = hp(rng.standard_normal(len(t)), 800) * np.exp(-t * 14)
roll = lp(rng.standard_normal(len(t)), 160) * 6 * np.exp(-t * 0.9) * (0.6 + 0.4 * np.sin(2 * np.pi * 1.3 * t))
save("thunder.wav", np.tanh(crack + roll), 0.9)

# Fire crackle: random pops over a low roar.
t = tt(10)
pops = (rng.random(len(t)) < 0.0008) * rng.standard_normal(len(t)) * 6
save("crackle.wav", hp(lp(pops, 4000), 300) + 0.6 * lp(rng.standard_normal(len(t)), 250), 0.6)

print("wrote", sorted(os.listdir(OUT)))
