import {Config} from '@remotion/cli/config';

Config.setVideoImageFormat('jpeg');
Config.setJpegQuality(92);
Config.setOverwriteOutput(true);
Config.setCodec('h264');
Config.setCrf(18);
// Headless Chrome otherwise renders WebGL/SVG in software (SwiftShader), and on this dual-GPU laptop 'angle' picks the
// Intel iGPU. Vulkan reaches the NVIDIA GTX 1050: ~15x faster, same picture (PSNR 47 dB vs software).
Config.setChromiumOpenGlRenderer('vulkan');
