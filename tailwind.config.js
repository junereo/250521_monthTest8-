// tailwind.config.js
import daisyui from 'daisyui';
module.exports = {
    content: ['./index.html',
        './src/**/*.{js,ts,jsx,tsx}',
        'node_modules/daisyui/dist/**/*.js',
        'node_modules/react-daisyui/dist/**/*.js',
    ],
    darkMode: 'class', // ✅ 클래스 기반 다크모드
    theme: {
        extend: {},
    },
    plugins: [require('daisyui')],
    daisyui: {
        themes: ['light', 'dark'], // DaisyUI 테마 설정
    },
};
