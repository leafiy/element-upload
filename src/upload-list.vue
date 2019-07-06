<template>
    <div>
        <draggable v-model="filesClone" @start="drag=true" @end="drag=false" class="el-upload-list2">
            <div v-for="file in files" :class="['el-upload-list2__item', 'is-' + file.status]" :key="file.uid" tabindex="0">
                <div class="el-upload-list2__item-thumbnail" @click="handleClick(file)">
                    <div class="el-upload-list2__item-thumbnail-img" :style="'background-image:url(' +file.url+ ')'"></div>
                    {{file.name}}
                </div>
                <el-progress v-if="file.status === 'uploading'" :text-inside="true" :stroke-width="20" :percentage="parsePercentage(file.percentage)">
                </el-progress>
                <span class="el-upload-list2__item-actions">
                    <span class="el-upload-list2__item-preview" v-if="handlePreview && file.status ==='success'" @click="handlePreview(file)">
                        <i class="el-icon-zoom-in"></i>
                    </span>
                    <span class="el-upload-list2__item-delete" @click="$emit('remove', file)">
                        <i class="el-icon-delete"></i>
                    </span>
                </span>
            </div>
        </draggable>
    </div>
</template>
<script>
import Locale from 'element-ui/src/mixins/locale';
import ElProgress from 'element-ui/packages/progress';
import './el-upload.scss'
import draggable from 'vuedraggable'



export default {

    name: 'ElUploadList',

    mixins: [Locale],

    data() {
        return {
            focusing: false,
            filesClone: []
        };
    },
    components: { ElProgress, draggable },

    props: {
        files: {
            type: Array,
            default () {
                return [];
            }
        },
        disabled: {
            type: Boolean,
            default: false
        },
        handlePreview: Function,
        listType: String
    },
    methods: {
        parsePercentage(val) {
            return parseInt(val, 10);
        },
        handleClick(file) {
            if (file.status == 'success') {
                this.handlePreview && this.handlePreview(file);
            }
        }
    },
    watch: {
        files(files) {
            this.filesClone = this.files
        },
        filesClone(filesClone) {
            if (filesClone.length) {
                this.$emit('order-changed', filesClone)
            }

        }
    },
    mounted() {
        this.files.forEach(item => {
            if (!item.uid) {
                item.uid = item.uid || (Date.now() + this.tempIndex++);
            }
        })

    }
};
</script>