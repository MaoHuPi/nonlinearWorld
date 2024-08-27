import cv2
import os

dir = '.' if os.path.isfile('./'+os.path.basename(__file__)) else os.path.dirname(os.path.abspath(__file__))
l = os.listdir(dir)
for name in l:
	if name.endswith('.png'):
		image = cv2.imread(dir + '\\' + name)
		image = cv2.resize(image, [1100, 1100], interpolation=cv2.INTER_NEAREST)
		cv2.imwrite(name.replace('.', '_s.'), image)

# ffmpeg -framerate 15 -i "./%d_s.png" -shortest -c:a aac -c:v libx264 -pix_fmt yuv420p "./out.mp4" -y