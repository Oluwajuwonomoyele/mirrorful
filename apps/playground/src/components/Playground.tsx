import { Box, Textarea, Button, Text, Stack } from '@chakra-ui/react'
import { useEffect, useRef, useState } from 'react'
import { transpileCode } from '../utils/transpileCode'
import MonacoEditor, { Monaco } from '@monaco-editor/react'
import { SOURCE_BOILERPLATE, DEFAULT_CODE } from '../utils/constants'
import { replaceImports } from '../utils/replacers'
import { TLogData } from '../types'
import { Console } from './Console'
import { Toolbar } from './Toolbar'
import { editor } from 'monaco-editor'
import { Source } from './Source'
import { TbDevices } from 'react-icons/tb'
import { API_ENV } from '../utils/constants'
import { Params, useLoaderData } from 'react-router-dom'
import { FileResponse } from '@mirrorful-fern/api-client/api'
import {
  MirrorfulApiClient,
  MirrorfulApiEnvironment,
} from '@mirrorful-fern/api-client'
import { useNavigate, useParams } from 'react-router-dom'

export async function loader({ params }: { params: Params<string> }) {
  const client = new MirrorfulApiClient({
    environment: API_ENV,
  })
  if (params && params.orgId && params.fileId) {
    return await client.registry.getFile(params.orgId, params.fileId)
  } else {
    return null
  }
}
import { PageRender } from './PageRender'

export function Playground() {
  const { fileId, orgId } = useParams()

  const file = useLoaderData() as FileResponse | null

  const [inputCode, setInputCode] = useState<string>(
    file ? file.code : DEFAULT_CODE
  )
  const [transpiledCode, setTranspiledCode] = useState<string>('')
  const [sourceCode, setSourceCode] = useState<string>('')
  const [logs, setLogs] = useState<TLogData[]>([
    {
      text: 'Welcome to Mirrorful!',
      type: 'info',
      timestamp: new Date().toLocaleTimeString(),
    },
  ])

  const [isResponsiveMode, setIsResponsiveMode] = useState<boolean>(false)

  const [panelTab, setPanelTab] = useState<'console' | 'source'>('console')
  const [widthDivide, setWidthDivide] = useState<number>(50)

  // Even when not in the editor, listen for the command
  useEffect(() => {
    let pressingCmd = false
    let pressingEnter = false
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') pressingEnter = true
      if (e.key === 'Meta') pressingCmd = true
      if (pressingEnter && pressingCmd) {
        handleTranspileCode(inputCode)
      }
    }
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Enter') pressingEnter = false
      if (e.key === 'Meta') pressingCmd = false
    }
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
    // because inputCode changes, we want to re-run the effect
    // this is pretty costly i think
  }, [inputCode])

  const handleTranspileCode = async (theInputCode: string) => {
    try {
      const modifiedInputCode = replaceImports(theInputCode)
      const { iframeCode, sourceCode: sc } = transpileCode(modifiedInputCode)
      const source = SOURCE_BOILERPLATE(iframeCode)
      setLogs([
        ...logs,
        {
          text: 'Code transpiled successfully',
          type: 'success',
          timestamp: new Date().toLocaleTimeString(),
        },
      ])
      setTranspiledCode(source)
      setSourceCode(sc)

      if (fileId && orgId) {
        const environment =
          process.env.NODE_ENV === 'production'
            ? MirrorfulApiEnvironment.Production
            : MirrorfulApiEnvironment.Development
        const client = new MirrorfulApiClient({
          environment,
        })

        await client.registry.updateFile(orgId, fileId, {
          code: theInputCode,
        })
      }
    } catch (e) {
      if (e instanceof Error) {
        setLogs([
          ...logs,
          {
            text: `Error: ${e.message}}`,
            type: 'error',
            timestamp: new Date().toLocaleTimeString(),
          },
        ])
      } else {
        throw e
      }
    }
  }

  function handleEditorWillMount(monaco: Monaco) {
    monaco.languages.typescript.typescriptDefaults.setCompilerOptions({})
    monaco.editor.defineTheme('dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [],
      colors: {
        'editor.background': '#040712',
      },
    })
  }

  function handleEditorDidMount(
    editor: editor.IStandaloneCodeEditor,
    monaco: Monaco
  ) {
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      handleTranspileCode(editor.getValue())
    })
  }

  const handleEditorChange = (value: string | undefined) => {
    setInputCode(value ?? '')
  }

  useEffect(() => {
    handleTranspileCode(inputCode)
  }, [])

  return (
    <>
      <Box
        css={{
          width: '100vw',
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
        }}
        backgroundColor={'bg'}
      >
        <Toolbar code={inputCode ?? ''} />
        <Box css={{ width: '100%', display: 'flex', flexGrow: 1 }}>
          <Box
            css={{
              flex: 1,
              flexBasis: '40%',
            }}
          >
            <MonacoEditor
              defaultLanguage="typescript"
              value={inputCode}
              beforeMount={handleEditorWillMount}
              onMount={handleEditorDidMount}
              onChange={handleEditorChange}
              options={{
                minimap: { enabled: false },
                scrollbar: { vertical: 'hidden' },
                hideCursorInOverviewRuler: true,
                overviewRulerLanes: 0,
                automaticLayout: true,
              }}
              height={'100%'}
              theme={'dark'}
            />
          </Box>
          <Box
            css={{
              position: 'fixed',
              bottom: '24px',
              right: '36px',
              zIndex: 2,
            }}
          >
            <Button
              backgroundColor={'bg'}
              borderColor={'divider'}
              borderWidth={'1px'}
              color={'playgroundText'}
              css={{
                backdropFilter: 'blur(2px)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
              }}
              _hover={{
                boxShadow: '0 0 20px 1px #805AD5',
                // bgGradient: 'linear(to-br, bg, primary, bg)',
              }}
              onClick={() => handleTranspileCode(inputCode)}
            >
              <Text>Run</Text>
              <Text
                css={{
                  marginLeft: '6px',
                  fontWeight: 'bold',
                }}
                color={'playgroundTextHover'}
              >
                ⌘ + Enter
              </Text>
            </Button>
          </Box>
          <Box
            id="right-side"
            css={{
              flexBasis: '60%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
            }}
            borderLeftWidth={'1px'}
            borderColor={'divider'}
          >
            <Box
              id="page-render"
              css={{
                flexBasis: '60%',
                display: 'flex',
                ...(isResponsiveMode && {
                  justifyContent: 'center',
                  alignItems: 'center',
                }),
              }}
            >
              <PageRender
                transpiledCode={transpiledCode}
                isResponsiveMode={isResponsiveMode}
                onCloseResponsiveMode={() => setIsResponsiveMode(false)}
              />
            </Box>
            <Box
              id="console"
              css={{
                flexBasis: '40%',
                display: 'flex',
                flexDirection: 'column',
              }}
              borderTopWidth={'1px'}
              borderColor={'divider'}
            >
              <Box
                css={{
                  height: '48px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px',
                }}
                borderBottomWidth={'1px'}
                borderColor="divider"
              >
                <Stack direction="row" spacing={8}>
                  <Button variant="tab" onClick={() => setPanelTab('console')}>
                    CONSOLE
                  </Button>
                  <Button variant="tab" onClick={() => setPanelTab('source')}>
                    SOURCE
                  </Button>
                </Stack>
                <Box>
                  <Button
                    variant="tab"
                    leftIcon={<TbDevices />}
                    css={{ fontSize: '22px' }}
                    onClick={() => setIsResponsiveMode(!isResponsiveMode)}
                    isActive={isResponsiveMode}
                  />
                </Box>
              </Box>
              <Box
                css={{
                  padding: '12px',
                  flexGrow: 1,
                  overflowY: 'scroll',
                  overflowX: 'hidden',
                }}
              >
                {panelTab === 'console' && <Console logs={logs} />}
                {panelTab === 'source' && <Source code={transpiledCode} />}
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>
    </>
  )
}