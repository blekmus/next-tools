import { ActualFileObject, FilePondFile } from 'filepond'
import { parse } from 'papaparse'


// extract file data asynchronously
const fileToData = (blob: ActualFileObject) => {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result)
    reader.readAsText(blob)
  })
}

// merge the csv files into one array
const mergeNumList = async (files: FilePondFile[], rowHeader: string) => {
  const csvFiles: string[] = []

  await Promise.all(
    files.map(async (file) => {
      const fileContent = await fileToData(file.file)
      const data = parse<{ [key: string]: string }>(fileContent as string, {
        header: true,
      }).data

      data.forEach((row) => {
        if (row[rowHeader]) {
          csvFiles.push(row[rowHeader])
        }
      })
    })
  )

  return csvFiles
}

// filter numbers from the array
const filterNumList = (numList: string[]) => {
  const filteredNumList: string[] = []

  numList.forEach((rawNum) => {
    let num = rawNum.replace(/\s+/g, '')

    const unwantedChars = ['+', '-', '(', ')', '[', ']', '.', '*', '#', '‡']
    num = num
      .split('')
      .filter((char) => {
        return !unwantedChars.includes(char)
      })
      .join('')

    if (num.startsWith('94')) {
      num = num.substring(2)
    }

    if (num.startsWith('0')) {
      num = num.substring(1)
    }

    if (!num.startsWith('7')) {
      return
    }

    filteredNumList.push(num)
  })

  return filteredNumList
}

// format numbers into numCode format
const formatNumList = (numList: string[], numCode: string) => {
  const numBase = numList.length.toString().length

  const formattedNumList: { base: string; num: string }[] = numList.map(
    (num, index) => {
      const paddedIndex = index.toString().padStart(numBase, '0')

      return {
        base: `${numCode}${paddedIndex}`,
        num: num,
      }
    }
  )

  return formattedNumList
}

// create vcf file from formatted numbers
const createVcfFile = (formattedNumList: { base: string; num: string }[]) => {
  const vcfFile = formattedNumList
    .map((formattedNum) => {
      return `BEGIN:VCARD\nVERSION:3.0\nFN:${formattedNum.base}\nN:;${formattedNum.base};;;\nitem1.TEL:${formattedNum.num}\nEND:VCARD\n\n`
    })
    .join('')

  return vcfFile
}

export {
    mergeNumList,
    filterNumList,
    formatNumList,
    createVcfFile
}