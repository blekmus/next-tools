import { useState } from 'react'
import {
  Group,
  Box,
  Collapse,
  ThemeIcon,
  UnstyledButton,
  createStyles,
} from '@mantine/core'
import { TablerIcon, IconChevronLeft, IconChevronRight } from '@tabler/icons'
import LinksSubGroup from './navbar.sub_links.component'
import Link from 'next/link'

const useStyles = createStyles(
  (theme, { initiallyOpened }: { initiallyOpened: boolean }) => ({
    control: {
      fontWeight: 500,
      display: 'block',
      width: '100%',
      padding: `${theme.spacing.xs}px ${theme.spacing.md}px`,
      color: theme.colors.dark[0],
      fontSize: theme.fontSizes.sm,

      '&:hover': {
        backgroundColor: theme.colors.dark[7],
        color: theme.white,
      },
    },

    link: {
      fontWeight: 500,
      display: 'block',
      textDecoration: 'none',
      padding: `${theme.spacing.xs}px ${theme.spacing.md}px`,
      paddingLeft: 31,
      marginLeft: 30,
      fontSize: theme.fontSizes.sm,
      color: theme.colors.dark[0],
      borderLeft: `1px solid ${theme.colors.dark[4]}`,

      '&:hover': {
        backgroundColor: theme.colors.dark[7],
        color: theme.white,
      },
    },

    chevron: {
      transition: 'transform 200ms ease',
    },

    title: {
      color: initiallyOpened ? theme.colors.gray[1] : theme.colors.dark[0],
      fontWeight: initiallyOpened ? 600 : 400,
    },
  })
)

interface LinksGroupProps {
  icon: TablerIcon
  label: string
  initiallyOpened: boolean
  links?: { label: string; link: string; id: string }[]
  activeSubGroup?: string
  link: string | null
}

const LinksGroup = ({
  icon: Icon,
  label,
  initiallyOpened,
  links,
  activeSubGroup,
  link
}: LinksGroupProps) => {
  const [opened, setOpened] = useState(initiallyOpened || false)

  const { classes, theme } = useStyles({ initiallyOpened })

  const ChevronIcon = theme.dir === 'ltr' ? IconChevronRight : IconChevronLeft

  if (!links || link) {
    return (
      <Link href={link ? link : ''}>
        <UnstyledButton
          className={classes.control}
          component="a"
        >
          <Group position="apart" spacing={0}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <ThemeIcon variant="light" size={35}>
                <Icon size={22} />
              </ThemeIcon>
              <Box ml="md" className={classes.title}>
                {label}
              </Box>
            </Box>
          </Group>
        </UnstyledButton>
      </Link>
    )
  } else {
    const items = links.map((link) => {
      return (
        <LinksSubGroup
          link={link}
          opened={link.id === activeSubGroup}
          key={link.id}
        />
      )
    })

    return (
      <>
        <UnstyledButton
          onClick={() => setOpened((o) => !o)}
          className={classes.control}
        >
          <Group position="apart" spacing={0}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <ThemeIcon variant="light" size={35}>
                <Icon size={22} />
              </ThemeIcon>
              <Box ml="md" className={classes.title}>
                {label}
              </Box>
            </Box>
              <ChevronIcon
                className={classes.chevron}
                size={14}
                stroke={1.5}
                style={{
                  transform: opened
                    ? `rotate(${theme.dir === 'rtl' ? -90 : 90}deg)`
                    : 'none',
                }}
              />
          </Group>
        </UnstyledButton>
        <Collapse in={opened}>{items}</Collapse>
      </>
    )
  }
}

export default LinksGroup
