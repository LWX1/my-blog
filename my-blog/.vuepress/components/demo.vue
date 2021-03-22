<template>
    <!-- <canvas id="myCanvas"></canvas> -->
</template>

<script>
import {startCanvas} from '../public/js/ball.js';
console.log(startCanvas)
export default {
    data() {
        return {
            ctx: null
        }
    },
    mounted() {
        // this.getCanvas();
        this.ctx = startCanvas({
            dom: '', // 没有默认为dom
            number:200
        })
    },
    methods: {
        // 全屏
        getCanvas() {
            let canvas = document.getElementById('canvas');
            canvas.width = document.documentElement.clientWidth;
            canvas.height = document.documentElement.clientHeight;
            this.ctx = canvas.getContext('2d');
        },

    },
    beforeDestroy() {
        this.ctx.clearRect();
    },
}
</script>

<style>

</style>