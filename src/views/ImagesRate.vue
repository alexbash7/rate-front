<template>
    <div>
        <div v-if="!isInitiated">Loading</div>
        <div v-if="isInitiated">
            <div class="menu1">
                <button v-shortkey.once="[',']" @shortkey="previousSlide()" @click="previousSlide()">&lt;</button>
                <button v-shortkey.once="['p']" @shortkey="stopOrPlay()" @click="stopOrPlay()" :class="{active: isStopped}">P</button>
            </div>
            <div class="menu2">
                <button
                    v-for="i in 4"
                    v-bind:key="i"
                    v-shortkey.once="[i]" @shortkey="rateImages(i); btnCounter++;" @click="rateImages(i); btnCounter++;"
                    :class="{active: activeScore == i}"
                >{{ i }}</button>
                <div>
                <span>Profiles showed: {{profileCounter}} </span>
                </div>
                <div>
                <span>%: {{percent}} </span>
                </div>
                <div>
                <span>ID: {{ imagesData[0].authorId }}</span>
                </div>
                <div>
                <span>DB: {{ imagesData[0].dbId }}</span>
                </div>
                <div>
                <span>Total done: {{ imagesData[0].totalDone }}</span>
                </div>
            </div>
            <div v-for="(imagesGroup, idx) in groupArray(imagesData, 9)" v-bind:key="idx" style="height: 100vh">
                <div v-for="(images, idx) in groupArray(imagesGroup, 3)" v-bind:key="idx" style="height: 33%">
                    <div class="row" style="height: 100%">
                        <div class="column" v-for="imageData in images" v-bind:key="imageData.postId">
                            <img class="post-image" :src="imageData.url" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style>
    button {
        height: 50px;
        width: 50px;
    }
    button.small {
        height: 25px;
        width: 25px;
    }
    button.active {
        background-color: brown;
    }
    .column {
        float: left;
        width: 29%;
        height: 100%;
        overflow: hidden;
    }
    .row:after {
        content: "";
        display: table;
        clear: both;
    }
    img.post-image {
        max-width:100%;
        width: 100%;
        top: 70%;
        transform: translateY(-50%);
        position: relative;
    }
    .menu1 {
        position: absolute;
        top: 0px;
        right: 0px;
    }
    .menu2 {
        position: absolute;
        top: 65px;
        right: 0px;
    }
</style>

<script>
import Axios from 'axios';
import config from '@/config.ts';
import Preload, { Order } from 'image-preload';

const uuidv1 = require('uuid/v1');

export default {
    data() {
        return {
            imagesData: [],
            nextImagesData: [],
            isInitiated: false,
            isPreloading: true,
            activeScore: null,
            isStopped: false,
            loadingSlideUUIDs: [],
            slideUpdatedAt: 0,
            btnCounter: 0,
            profileCounter:0,
            percent:0,
        };
    },
    methods: {
        groupArray(arr, size) {
            var grouped = [];

            for (var i = 0; i < arr.length; i += size)
                grouped.push(arr.slice(i, i + size));

            return grouped;
        },
        getNextAndPreload(onComplete) {
            return this.getAndPreload(
                'Next',
                onComplete
            );
        },
        getPrevAndPreload(onComplete) {
            return this.getAndPreload(
                'Prev',
                onComplete
            );
        },
        getAndPreload(type, onComplete) {
            this.isPreloading = true;

            var requestUUID = uuidv1();
            this.loadingSlideUUIDs.push(requestUUID);

            console.log('last: ' + (this.imagesData.length > 0 ? this.imagesData[0].authorId : 0));

            Axios
                .post(config.apiUrl('get'+type+'Images'), { refId: this.imagesData.length > 0 ? this.imagesData[0].dbId : 0 })
                .then(res => {
                    var nextImagesData = res.data.data;

                    var urls = [];
                    for (var i = 0; i < nextImagesData.length; i++) {
                        urls.push(nextImagesData[i].url);
                    }

                    Preload(urls, {
                        order: Order.AllAtOnce,
                        onSingleImageFail: () => {
                            this.onPreloadComplete(requestUUID, nextImagesData, onComplete);
                        },
                        onComplete: () => {
                            this.onPreloadComplete(requestUUID, nextImagesData, onComplete);
                        }
                    });
                });

            return requestUUID;
        },
        onPreloadComplete(requestUUID, nextImagesData, callback) {
            if (this.loadingSlideUUIDs.indexOf(requestUUID) < 0)
                return;

            this.nextImagesData = nextImagesData;
            this.isPreloading = false;

            if (callback)
                callback();
        },

        previousSlide() {
            this.cancelLoad();
            this.getPrevAndPreload(() => {
                this.updateSlide();
                this.profileCounter = this.profileCounter - 1;
                if (!this.isStopped)
                    this.getNextAndPreload();
            });
        },
        nextSlide() {
            this.cancelLoad();
            this.getNextAndPreload(() => {
                this.updateSlide();
                if (!this.isStopped)
                    this.getNextAndPreload();
            });
        },
        stopOrPlay() {
            var wasStopped = this.isStopped;
            this.isStopped = !this.isStopped;

            if (wasStopped) {
                this.updateSlide(true);
                this.getNextAndPreload();
            } else
                this.cancelLoad();
                Axios.get(config.apiUrl('pauseImages')).then(res => {});
        },
        cancelLoad() {
            this.loadingSlideUUIDs = [];
        },

        updateSlide(dryShot) {
            if (!dryShot) {
                this.imagesData = this.nextImagesData;
                this.activeScore = null;
                this.profileCounter = this.profileCounter + 1;
            }

            this.slideUpdatedAt = Date.now();
        },
        doTimer() {
            var delayTime = process.env.VUE_APP_SLIDE_TIME_MS;

            if (this.isPreloading)
                delayTime = 100;

            if (!this.isStopped && !this.isPreloading) {
                var timeSinceLast = Date.now() - this.slideUpdatedAt;

                var skipThis = false;
                if (timeSinceLast < delayTime) {
                    delayTime = delayTime - timeSinceLast;
                    skipThis = true;
                }

                if (!skipThis) {
                    this.updateSlide();
                    this.getNextAndPreload();
                }
            }

            setTimeout(() => {
                this.doTimer();
            }, delayTime);
        },

        rateImages(score) {
            this.activeScore = score;

            Axios
                .post(config.apiUrl('rateImages'), { authorId: this.imagesData[0].authorId, score: score })
                .then(res => {
                });
        },
        rateSingleImage(score, url) {
            Axios
                .post(config.apiUrl('rateSingleImage'), { url: url, score: score })
                .then(res => {
                });
        },
        percentBtnToProf() {
            this.percent = Math.round((this.btnCounter / this.profileCounter) * 100);
        }
    },
    mounted() {
        this.getNextAndPreload(() => {
            this.doTimer();
            this.isInitiated = true;
        });
    },
    updated() {
        this.percentBtnToProf()
    }
}
</script>
