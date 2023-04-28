import { useState } from 'react'
import { InboxOutlined } from '@ant-design/icons'
import { Button, UploadProps, message, Upload } from 'antd'
import { RcFile, UploadFile } from 'antd/es/upload/interface'
import axios from 'axios'
import client from '../../client/axios'
import APIS from '../../constants/api'
import { CreateProjectReponse } from '../../constants/types'

const { Dragger } = Upload

function UploadForm() {
	const [fileList, setFileList] = useState<UploadFile[]>([])
	const [uploading, setUploading] = useState(false)

	const props: UploadProps = {
		name: 'file',
		multiple: false,
		onRemove: () => {
			setFileList([])
		},
		beforeUpload: (file) => {
			setFileList([file])
			return false
		},
		fileList,
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const uploadFile = ({ data, file }: { data: any; file: RcFile }) => {
		const formData = new FormData()
		Object.keys(data.fields).forEach((key) => {
			formData.append(key, data.fields[key])
		})
		formData.append('file', file)
		axios
			.post(data.url, formData)
			.then(() => {
				message.success('Upload completed!')
				setFileList([])
			})
			.catch(() => {
				message.error('Upload failed.')
			})
	}

	const upload = () => {
		setUploading(true)
		client
			.post<CreateProjectReponse>(APIS.CREATE_PROJECT, {
				file_name: fileList[0].name,
				name: fileList[0].name,
			})
			.then((reponse) => {
				uploadFile({
					data: reponse.data.presigned_url,
					file: fileList[0] as RcFile,
				})
			})
			.catch(() => {
				message.error('Upload failed.')
			})
			.finally(() => {
				setUploading(false)
			})
	}

	return (
		<div>
			{/* eslint-disable-next-line react/jsx-props-no-spreading */}
			<Dragger {...props}>
				<p className="ant-upload-drag-icon">
					<InboxOutlined />
				</p>
				<p className="ant-upload-text">
					Click or drag file to this area to upload
				</p>
				<p className="ant-upload-hint">
					Support for a single upload. Strictly prohibit from uploading company
					data or other band files
				</p>
			</Dragger>
			<Button
				type="primary"
				onClick={upload}
				disabled={fileList.length === 0}
				loading={uploading}
				className="mt-2"
			>
				{uploading ? 'Uploading' : 'Start Upload'}
			</Button>
		</div>
	)
}

export default UploadForm