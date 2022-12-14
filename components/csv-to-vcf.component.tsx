import {
  Box,
  Button,
  Card,
  Container,
  createStyles,
  Input,
  Text,
  Title,
} from '@mantine/core'
import type { NextPage } from 'next'
import NavbarMain from './navbar.component'
import { FilePond } from 'react-filepond'
import { useState } from 'react'
import { FilePondFile, registerPlugin } from 'filepond'
import FilePondPluginFileValidateType from 'filepond-plugin-file-validate-type'
import {
  createVcfFile,
  createCSVFile,
  filterNumList,
  formatNumList,
  mergeNumList,
} from '../lib/csv-to-vcf'

const useStyles = createStyles(() => ({
  base: {
    display: 'flex',
    overflow: 'hidden',
    height: '100vh',
  },
}))

registerPlugin(FilePondPluginFileValidateType)

const CsvToVcf: NextPage = () => {
  const { classes } = useStyles()
  const [files, setFiles] = useState<FilePondFile[]>([])
  const [code, setCode] = useState<string>('')
  const [rowHeader, setRowHeader] = useState<string>('')
  const [downloadUrl, setDownloadUrl] = useState<string>('')
  const [downloadCSVUrl, setDownloadCSVUrl] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string>('')
  const [inputNumbers, setInputNumbers] = useState<number>(0)
  const [outputNumbers, setOutputNumbers] = useState<number>(0)
  const [duplicateNumbers, setDuplicateNumbers] = useState<number>(0)
  const [invalidNumbers, setInvalidNumbers] = useState<number>(0)

  const handleConvert = async () => {
    setError('')

    if (files.length === 0) {
      setError('Please select at least one file')
      return
    }

    if (!code) {
      setError('Please enter code')
      return
    }

    if (!rowHeader) {
      setError('Please enter row header')
      return
    }
    setDownloadUrl('')
    setDownloadCSVUrl('')
    setLoading(true)
    const merged = await mergeNumList(files, rowHeader)

    if (merged.length === 0) {
      setError('No numbers found or the row header is incorrect')
      setLoading(false)
      return
    }

    setInputNumbers(merged.length)

    const filtered = filterNumList(merged)
    setInvalidNumbers(merged.length - filtered.length)

    const deduplicated = filtered.filter(
      (item, index) => filtered.indexOf(item) === index
    )
    setDuplicateNumbers(filtered.length - deduplicated.length)

    const formatted = formatNumList(deduplicated, code)
    setOutputNumbers(formatted.length)

    const vcfFile = createVcfFile(formatted)
    const csvFile = createCSVFile(formatted)

    // vcf file
    const blob = new Blob([vcfFile], { type: 'text/vcard' })
    const file = new File([blob], 'contacts.vcf', { type: 'text/vcard' })
    const url = URL.createObjectURL(file)
    setDownloadUrl(url)

    // csv file
    const csvBlob = new Blob([csvFile], { type: 'text/csv' })
    const csvFileObj = new File([csvBlob], 'contacts.csv', { type: 'text/csv' })
    const csvUrl = URL.createObjectURL(csvFileObj)
    setDownloadCSVUrl(csvUrl)

    setLoading(false)
  }

  return (
    <Box className={classes.base}>
      <NavbarMain activeGroup="tools" activeSubGroup="csv-to-vcf" />

      <Box sx={{ overflow: 'auto', width: '100%' }}>
        <Container size="lg" pt="lg">
          <Title order={2}>CSV to VCF</Title>

          <Box mt={30}>
            <Card mb="lg">
              <Title order={4}>1. Upload file</Title>

              <Text size="sm" mb="md" color="dimmed">
                Adding multiple files will merge them and filter out duplicates.
              </Text>

              <FilePond
                onupdatefiles={setFiles}
                allowMultiple={true}
                maxFiles={100}
                allowReorder={false}
                acceptedFileTypes={['text/csv']}
                storeAsFile={true}
              />
            </Card>

            <Card mb="lg">
              <Title order={4}>2. Set Info</Title>

              <Text size="sm" color="dimmed" mb="md">
                Watch out for Capitals when setting row header. If there is
                none, create one.
              </Text>

              <Input
                sx={{ maxWidth: '300px' }}
                variant="filled"
                placeholder="Code (eg: GGG, SCS)"
                size="md"
                mb="sm"
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setCode(e.currentTarget.value)
                }
              />

              <Input
                sx={{ maxWidth: '300px' }}
                variant="filled"
                placeholder="Row Header (eg: Number)"
                size="md"
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setRowHeader(e.currentTarget.value)
                }
              />

              {error !== '' && (
                <Text size="sm" mt="sm" color="red" weight={600}>
                  {error}
                </Text>
              )}
            </Card>

            <Card mb="lg">
              <Title order={4} mb="md">
                3. Convert
              </Title>
              <Button color="gray" onClick={handleConvert} loading={loading}>
                Convert
              </Button>
            </Card>

            <Card mb="lg">
              <Title order={4}>4. Download</Title>

              {downloadUrl && (
                <Text size="sm" color="green" mb="md">
                  Converted successfully! <br />
                  Input numbers: {inputNumbers} | Output numbers:{' '}
                  {outputNumbers} | Duplicates: {duplicateNumbers} | Invalids:{' '}
                  {invalidNumbers}
                </Text>
              )}

              {downloadUrl && (
                <a
                  href={downloadUrl}
                  target="_blank"
                  rel="noreferrer"
                  download="contacts.vcf"
                >
                  <Button mr="sm">Download VCF</Button>
                </a>
              )}

              {downloadCSVUrl && (
                <a
                  href={downloadCSVUrl}
                  target="_blank"
                  rel="noreferrer"
                  download="contacts.csv"
                >
                  <Button>Download CSV</Button>
                </a>
              )}
            </Card>
          </Box>
        </Container>
      </Box>
    </Box>
  )
}

export default CsvToVcf
