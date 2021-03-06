<script>
import UploadList from './upload-list';
import Upload from './upload';
import ElProgress from 'element-ui/packages/progress';
import Migrating from 'element-ui/src/mixins/migrating';

function noop() {}

export default {
    name: 'ElUpload2',

    mixins: [Migrating],

    components: {
        ElProgress,
        UploadList,
        Upload
    },

    provide() {
        return {
            uploader: this
        };
    },

    inject: {
        elForm: {
            default: ''
        }
    },
    model: {
        prop: 'fileList',
        event: 'file-list-change'
    },
    props: {
        fileList: {
            type: Array,
            default: []
        },
        action: {
            type: String,
            required: true
        },
        headers: {
            type: Object,
            default () {
                return {};
            }
        },
        data: Object,
        multiple: Boolean,
        name: {
            type: String,
            default: 'file'
        },
        drag: Boolean,
        dragger: Boolean,
        withCredentials: Boolean,
        showFileList: {
            type: Boolean,
            default: true
        },
        accept: String,
        type: {
            type: String,
            default: 'select'
        },
        beforeUpload: Function,
        beforeRemove: Function,
        onRemove: {
            type: Function,
            default: noop
        },
        onChange: {
            type: Function,
            default: noop
        },
        onPreview: {
            type: Function
        },
        onSuccess: {
            type: Function,
            default: noop
        },
        onProgress: {
            type: Function,
            default: noop
        },
        onError: {
            type: Function,
            default: noop
        },
        onTimeout: {
            type: Function,
            default: noop
        },
        timeout: {
            type: Number,
            default: 30000
        },
        autoUpload: {
            type: Boolean,
            default: true
        },
        listType: {
            type: String,
            default: 'text' // text,picture,picture-card
        },
        httpRequest: Function,
        disabled: Boolean,
        limit: Number,
        onExceed: {
            type: Function,
            default: noop
        }
    },

    data() {
        return {
            // uploadFiles: [],
            dragOver: false,
            draging: false,
            tempIndex: 1,
            list: []
        };
    },

    computed: {
        uploadDisabled() {
            return this.disabled || (this.elForm || {}).disabled;
        },
        uploadFiles: {
            get: function() {
                return this.list
            },
            set: function(uploadFiles) {

                this.list = uploadFiles
            }
        }
    },

    watch: {
        fileList(fileList) {
            if (JSON.stringify(fileList) === JSON.stringify(this.uploadFiles)) {
                return
            }
            this.list = fileList.map(item => {
                item.uid = item.uid || (Date.now() + this.tempIndex++);
                item.status = item.status || 'success';
                return item;
            });
        },
        uploadFiles(uploadFiles) {
            this.$emit('file-list-change', uploadFiles)
        }
    },
    methods: {
        handleStart(rawFile) {
            rawFile.uid = Date.now() + this.tempIndex++;
            let file = {
                status: 'ready',
                name: rawFile.name,
                size: rawFile.size,
                percentage: 0,
                uid: rawFile.uid,
                raw: rawFile
            };

            try {
                file.url = URL.createObjectURL(rawFile);
            } catch (err) {
                console.error('[Element Error][Upload]', err);
                return;
            }

            this.uploadFiles.push(file);
            this.onChange(file, this.uploadFiles);
        },
        handleProgress(ev, rawFile) {
            const file = this.getFile(rawFile);
            this.onProgress(ev, file, this.uploadFiles);
            file.status = 'uploading';
            file.percentage = ev.percent || 0;
        },
        handleSuccess(res, rawFile) {
            const file = this.getFile(rawFile);

            if (file) {
                file.status = 'success';
                file.response = res;

                this.onSuccess(res, file, this.uploadFiles);
                this.onChange(file, this.uploadFiles);
            }
        },
        handleError(err, rawFile) {
            const file = this.getFile(rawFile);
            const fileList = this.uploadFiles;

            file.status = 'fail';

            fileList.splice(fileList.indexOf(file), 1);

            this.onError(err, file, this.uploadFiles);
            this.onChange(file, this.uploadFiles);
        },
        handleTimeout(err, rawFile) {
            const file = this.getFile(rawFile);
            const fileList = this.uploadFiles;

            file.status = 'fail';

            fileList.splice(fileList.indexOf(file), 1);
            this.onTimeout(err, file)
            this.onChange(file, this.uploadFiles);

        },
        handleOrderChange(files) {
            this.uploadFiles = files
            this.$emit('order-change', files)
        },
        handleRemove(file, raw) {
            if (raw) {
                file = this.getFile(raw);
            }
            let doRemove = () => {
                this.abort(file);
                let fileList = this.uploadFiles;
                fileList.splice(fileList.indexOf(file), 1);
                this.onRemove(file, fileList);
            };

            if (!this.beforeRemove) {
                doRemove();
            } else if (typeof this.beforeRemove === 'function') {
                const before = this.beforeRemove(file, this.uploadFiles);
                if (before && before.then) {
                    before.then(() => {
                        doRemove();
                    }, noop);
                } else if (before !== false) {
                    doRemove();
                }
            }
        },
        getFile(rawFile) {
            let fileList = this.uploadFiles;
            let target;
            fileList.every(item => {
                target = rawFile.uid === item.uid ? item : null;
                return !target;
            });
            return target;
        },
        abort(file) {
            this.$refs['upload-inner'].abort(file);
        },
        clearFiles() {
            this.uploadFiles = [];
        },
        submit() {
            this.uploadFiles
                .filter(file => file.status === 'ready')
                .forEach(file => {
                    this.$refs['upload-inner'].upload(file.raw);
                });
        },
        getMigratingConfig() {
            return {
                props: {
                    'default-file-list': 'default-file-list is renamed to file-list.',
                    'show-upload-list': 'show-upload-list is renamed to show-file-list.',
                    'thumbnail-mode': 'thumbnail-mode has been deprecated, you can implement the same effect according to this case: http://element.eleme.io/#/zh-CN/component/upload#yong-hu-tou-xiang-shang-chuan'
                }
            };
        }
    },

    beforeDestroy() {
        this.uploadFiles.forEach(file => {
            if (file.url && file.url.indexOf('blob:') === 0) {
                URL.revokeObjectURL(file.url);
            }
        });
    },

    render(h) {
        let uploadList;

        if (this.showFileList) {
            uploadList = (
                <UploadList
          disabled={this.uploadDisabled}
          listType={this.listType}
          files={this.uploadFiles}
          on-order-changed={this.handleOrderChange}
          on-remove={this.handleRemove}
          handlePreview={this.onPreview}>
        </UploadList>
            );
        }

        const uploadData = {
            props: {
                type: this.type,
                drag: this.drag,
                action: this.action,
                multiple: this.multiple,
                'before-upload': this.beforeUpload,
                'with-credentials': this.withCredentials,
                headers: this.headers,
                name: this.name,
                data: this.data,
                accept: this.accept,
                fileList: this.uploadFiles,
                autoUpload: this.autoUpload,
                listType: this.listType,
                disabled: this.uploadDisabled,
                limit: this.limit,
                timeout: this.timeout,
                'on-exceed': this.onExceed,
                'on-start': this.handleStart,
                'on-progress': this.handleProgress,
                'on-success': this.handleSuccess,
                'on-error': this.handleError,
                'on-preview': this.onPreview,
                'on-timeout': this.handleTimeout,
                'on-remove': this.handleRemove,
                'http-request': this.httpRequest
            },
            ref: 'upload-inner'
        };

        const trigger = this.$slots.trigger || this.$slots.default;
        const uploadComponent = <upload {...uploadData}>{trigger}</upload>;

        return (
            <div>
        { this.listType === 'picture-card' ? uploadList : ''}
        {
          this.$slots.trigger
            ? [uploadComponent, this.$slots.default]
            : uploadComponent
        }
        {this.$slots.tip}
        { this.listType !== 'picture-card' ? uploadList : ''}
      </div>
        );
    }
};
</script>