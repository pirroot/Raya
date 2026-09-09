import localFont from 'next/font/local';

export const rokhFont = localFont({
  src: [
    {
      path: '../../public/fonts/Rokh-Thin.woff2',
      weight: '100',
      style: 'normal',
    },
    {
      path: '../../public/fonts/Rokh-HairLine.woff2',
      weight: '100',
      style: 'normal',
    },
    {
      path: '../../public/fonts/Rokh-ExtraLight.woff2',
      weight: '200',
      style: 'normal',
    },
    {
      path: '../../public/fonts/Rokh-Light.woff2',
      weight: '300',
      style: 'normal',
    },
    {
      path: '../../public/fonts/Rokh-Regular.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../../public/fonts/Rokh-Normal.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../../public/fonts/Rokh-Medium.woff2',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../../public/fonts/Rokh-SemiBold.woff2',
      weight: '600',
      style: 'normal',
    },
    {
      path: '../../public/fonts/Rokh-Bold.woff2',
      weight: '700',
      style: 'normal',
    },
    {
      path: '../../public/fonts/Rokh-ExtraBold.woff2',
      weight: '800',
      style: 'normal',
    },
    {
      path: '../../public/fonts/Rokh-UltraBold.woff2',
      weight: '800',
      style: 'normal',
    },
    {
      path: '../../public/fonts/Rokh-Black.woff2',
      weight: '900',
      style: 'normal',
    },
  ],
  variable: '--font-rokh',
  display: 'swap',
});

export default rokhFont;
