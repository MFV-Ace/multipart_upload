import { useState } from "react"
import { UploadProps, Upload, UploadFile, Button, message, Progress } from "antd"
import { UploadOutlined } from "@ant-design/icons"
import "./App.css"
import axios from "axios"
import { RcFile } from "antd/es/upload"

axios.defaults.baseURL = "http://localhost:8000"

function App() {
  const [uploading, setUploading] = useState(false)
  const [fileList, setFileList] = useState<UploadFile[]>([])
	const [uploadPercent, setUploadPercent] = useState<number>(0)

  const uploadFile = ({ data, file }: { data: any; file: RcFile }) => {
    const uploadPart = (part_meta: { part_id: number; url: string }) => {
      const chunk = file.slice(
        (part_meta.part_id - 1) * data.meta.max_part_size,
        part_meta.part_id * data.meta.max_part_size
      )
      return axios.put(part_meta.url, chunk).then((res) => {
				setUploadPercent((state) => state + 100/data.meta.number_of_parts)
        return res
      })
    }
    const promiseArray = data.parts.map(uploadPart)
    Promise.all(promiseArray).then((promiseData) => {
      const parts: { ETag: string | undefined; PartNumber: number }[] = []
      promiseData.map((res: { headers: { etag: any } }, index: number) => {
        parts.push({
          ETag: res.headers.etag,
          PartNumber: index + 1,
        })
      })
      axios
        .post(`/document/upload/complete`, {
          parts: parts,
					id: data.meta.id
        })
        .then(() => {
          message.success("Upload completed!")
					setUploading(false)
        })
    })
  }

  const handleUpload = () => {
    setUploading(true)
    axios
      .post("document/upload/start_upload", {
        file_name: fileList[0].name,
        file_size: fileList[0].size,
      })
      .then((response) => {
        uploadFile({
          data: response.data,
          file: fileList[0] as RcFile,
        })
      })
      .catch(() => {
        message.error("Upload failed.")
      })
  }

  const props: UploadProps = {
    name: "file",
    multiple: false,
    onRemove: (file) => {
      const index = fileList.indexOf(file)
      const newFileList = fileList.slice()
      newFileList.splice(index, 1)
      setFileList(newFileList)
    },
    beforeUpload: (file) => {
      setFileList([file])
      return false
    },
    fileList,
  }

  return (
    <div className="App">
      <h1>Multipart Upload</h1>
      <Upload {...props}>
        <Button icon={<UploadOutlined />}>Select File</Button>
      </Upload>
			{uploading && (
				<Progress 
					percent={Math.ceil(uploadPercent)}
				/>
			)}
      <Button
        type="primary"
        onClick={handleUpload}
        disabled={fileList.length === 0}
        loading={uploading}
        style={{ marginTop: 16 }}
      >
        {uploading ? "Uploading" : "Start Upload"}
      </Button>
    </div>
  )
}

export default App
